/* VoiceMind — живые элементы сайта. Без библиотек. */
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(pointer: fine)").matches;

  // ── Шапка: фон после прокрутки ───────────────────────────────
  const top = document.getElementById("top");
  const onScroll = () => top.classList.toggle("scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // ── Появление блоков ─────────────────────────────────────────
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
  document.querySelectorAll(".reveal, .device__img").forEach((el, i) => {
    // Лёгкая лесенка для соседних элементов
    el.style.transitionDelay = `${(i % 4) * 70}ms`;
    io.observe(el);
  });

  // ── Телефон: смена экранов и печать текста ───────────────────
  const screen = document.querySelector(".screen");
  const typing = document.querySelector(".typing__text");
  const phrases = [
    "Тогда договор отправляем до среды, а юристы посмотрят его в четверг.",
    "Значит, подписываем до конца месяца. Счёт готовлю я.",
  ];
  let scr = 0, phrase = 0;
  function typeText(text, done) {
    if (reduce) { typing.textContent = text; setTimeout(done, 2500); return; }
    typing.textContent = "";
    let i = 0;
    const tick = () => {
      typing.textContent = text.slice(0, ++i);
      if (i < text.length) setTimeout(tick, 32 + Math.random() * 40);
      else setTimeout(done, 1400);
    };
    tick();
  }
  function cycle() {
    screen.dataset.screen = scr;
    if (scr === 0) {
      typeText(phrases[phrase++ % phrases.length], () => { scr = 1; cycle(); });
    } else {
      setTimeout(() => { scr = (scr + 1) % 3; cycle(); }, scr === 1 ? 3600 : 3800);
    }
  }
  if (screen) cycle();

  // ── Телефон: наклон за курсором ──────────────────────────────
  const phone = document.getElementById("phone");
  if (phone && fine && !reduce) {
    const hero = document.querySelector(".hero");
    hero.addEventListener("mousemove", (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      phone.style.transform = `rotateY(${-14 + x * 22}deg) rotateX(${6 - y * 14}deg)`;
    });
    hero.addEventListener("mouseleave", () => { phone.style.transform = ""; });
  }

  // ── Волна голоса ─────────────────────────────────────────────
  const cv = document.getElementById("voice");
  if (cv && !reduce) {
    const ctx = cv.getContext("2d");
    let w = 0, h = 0, t = 0, mx = 0.5, energy = 1, running = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", (e) => { mx = e.clientX / window.innerWidth; energy = 1.6; }, { passive: true });
    const lines = [
      { amp: .34, freq: 1.6, speed: .9, color: [240, 192, 64], width: 2.2, alpha: .9 },
      { amp: .26, freq: 2.3, speed: -1.2, color: [255, 222, 133], width: 1.4, alpha: .55 },
      { amp: .22, freq: 3.1, speed: 1.6, color: [217, 130, 43], width: 1.2, alpha: .5 },
      { amp: .16, freq: 1.1, speed: -.6, color: [124, 193, 184], width: 1, alpha: .35 },
    ];
    // Огибающая: волна живёт в центре и затухает к краям, «дышит» как речь.
    const env = (x) => Math.pow(Math.sin(Math.PI * x), 2.2);
    function draw() {
      if (!running) return;
      t += 0.012;
      energy += (1 - energy) * 0.02;
      ctx.clearRect(0, 0, w, h);
      const speech = (0.55 + 0.45 * Math.sin(t * 1.7) * Math.sin(t * 0.63 + 1)) * energy;
      for (const L of lines) {
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        const [r, g, b] = L.color;
        grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
        grad.addColorStop(Math.max(.05, mx - .25), `rgba(${r},${g},${b},${L.alpha * .6})`);
        grad.addColorStop(mx, `rgba(${r},${g},${b},${L.alpha})`);
        grad.addColorStop(Math.min(.95, mx + .25), `rgba(${r},${g},${b},${L.alpha * .6})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.strokeStyle = grad; ctx.lineWidth = L.width;
        ctx.shadowColor = `rgba(${r},${g},${b},.6)`; ctx.shadowBlur = 14;
        ctx.beginPath();
        for (let px = 0; px <= w; px += 4) {
          const x = px / w;
          const y = h * .55 + Math.sin(x * Math.PI * 2 * L.freq + t * L.speed * 3) *
                    Math.sin(x * Math.PI * 5 + t * 2.1) * h * L.amp * env(x) * speech;
          px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
        }
        ctx.stroke();
      }
      requestAnimationFrame(draw);
    }
    // Не рисуем, когда первый экран не виден.
    new IntersectionObserver(([e]) => {
      const was = running; running = e.isIntersecting;
      if (running && !was) requestAnimationFrame(draw);
    }).observe(cv);
    requestAnimationFrame(draw);
  }

  // ── «Как устроено»: экран переключается по шагу ──────────────
  const mini = document.getElementById("mini");
  const steps = document.querySelectorAll(".step");
  if (steps.length) {
    const so = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        steps.forEach((s) => s.classList.toggle("active", s === e.target));
        if (mini) mini.dataset.pane = e.target.dataset.step;
      }
    }, { rootMargin: "-45% 0px -45% 0px" });
    steps.forEach((s) => so.observe(s));
    steps[0].classList.add("active");
  }

  // ── Параллакс фото ───────────────────────────────────────────
  const par = document.querySelectorAll(".parallax");
  if (par.length && !reduce) {
    let ticking = false;
    const upd = () => {
      for (const el of par) {
        const r = el.parentElement.getBoundingClientRect();
        const p = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
        el.style.transform = `translate3d(0, ${p * -12}%, 0) scale(1.05)`;
      }
      ticking = false;
    };
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  // ── Список: фото за курсором ─────────────────────────────────
  const float = document.getElementById("floatImg");
  if (float && fine && !reduce) {
    const img = float.querySelector("img");
    let fx = 0, fy = 0, tx = 0, ty = 0, raf = 0;
    const follow = () => {
      fx += (tx - fx) * 0.14; fy += (ty - fy) * 0.14;
      float.style.left = fx + "px"; float.style.top = fy + "px";
      raf = requestAnimationFrame(follow);
    };
    document.querySelectorAll(".index li").forEach((li) => {
      li.addEventListener("mouseenter", (e) => {
        img.src = li.dataset.img; tx = fx = e.clientX + 170; ty = fy = e.clientY;
        float.classList.add("on");
        if (!raf) raf = requestAnimationFrame(follow);
      });
      li.addEventListener("mousemove", (e) => { tx = e.clientX + 170; ty = e.clientY; });
      li.addEventListener("mouseleave", () => { float.classList.remove("on"); });
    });
  }
})();
