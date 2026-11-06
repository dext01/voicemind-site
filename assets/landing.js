(() => {
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  function selectTab(tab) {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
    });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      selectTab(tabs[next]);
      tabs[next].focus();
    });
  });
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.getElementById('mobile-menu');
  function closeMenu() {
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Открыть меню');
  }
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !menu.hidden) { closeMenu(); toggle.focus(); }
  });
  fetch('/download/latest.json', { cache: 'no-cache' })
    .then(response => { if (!response.ok) throw new Error('Release unavailable'); return response.json(); })
    .then(release => {
      // Only use a local APK path supplied by the existing release manifest.
      if (!/^\/download\/[a-zA-Z0-9._-]+\.apk$/.test(release.file)) throw new Error('Invalid APK path');
      const button = document.getElementById('apkBtn');
      button.href = release.file;
      button.setAttribute('download', '');
      document.getElementById('apkLabel').textContent = 'Скачать APK · ' + release.version;
      document.getElementById('apkMeta').textContent = Math.round(release.size / 1e6) + ' МБ · ' + release.date;
      document.getElementById('apkSha').textContent = release.sha256;
    }).catch(() => {
      document.getElementById('apkMeta').textContent = 'Уточните доступность сборки в Telegram проекта.';
    });
})();
