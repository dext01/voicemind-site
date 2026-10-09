# Деплой voice-mind.ru на GitHub Pages

Сайт — статические файлы (`index.html`, `404.html`, `assets/`), без сборки.
Публикует их workflow `.github/workflows/pages.yml` при каждом пуше в `main`.

Ниже `dext01` — аккаунт, под которым залогинен `gh` (проверено `gh auth status`).
Репозиторий в командах назван `voicemind-site`, можно выбрать другое имя.

---

## 1. Создать репозиторий и запушить

```bash
cd /home/stepan/voicemind/site
gh repo create dext01/voicemind-site --public --source . --remote origin --push
```

## 2. Включить Pages из GitHub Actions

Через веб: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Или одной командой:

```bash
gh api -X POST repos/dext01/voicemind-site/pages -f build_type=workflow
```

Потом перезапустить деплой (первый прогон после пуша мог упасть, пока Pages был выключен):

```bash
gh workflow run pages.yml -R dext01/voicemind-site
gh run watch -R dext01/voicemind-site
```

До привязки домена сайт откроется на `https://dext01.github.io/voicemind-site/`. На странице 404
там могут не подгрузиться стили, потому что пути в ней от корня домена. На voice-mind.ru всё будет работать.

## 3. DNS-записи в Selectel

Панель Selectel → **DNS-хостинг** → зона `voice-mind.ru` → добавить записи.
Сначала **удалите** записи для `@` и `www`, которые Selectel мог создать по умолчанию
(A/AAAA/CNAME парковки), иначе они будут конфликтовать.

| Тип   | Имя (хост)             | Значение              | TTL  |
|-------|------------------------|-----------------------|------|
| A     | `voice-mind.ru` (`@`)  | `185.199.108.153`     | 3600 |
| A     | `voice-mind.ru` (`@`)  | `185.199.109.153`     | 3600 |
| A     | `voice-mind.ru` (`@`)  | `185.199.110.153`     | 3600 |
| A     | `voice-mind.ru` (`@`)  | `185.199.111.153`     | 3600 |
| AAAA  | `voice-mind.ru` (`@`)  | `2606:50c0:8000::153` | 3600 |
| AAAA  | `voice-mind.ru` (`@`)  | `2606:50c0:8001::153` | 3600 |
| AAAA  | `voice-mind.ru` (`@`)  | `2606:50c0:8002::153` | 3600 |
| AAAA  | `voice-mind.ru` (`@`)  | `2606:50c0:8003::153` | 3600 |
| CNAME | `www`                  | `dext01.github.io`    | 3600 |

Адреса сверены с документацией GitHub «Managing a custom domain for your GitHub Pages site»
(docs.github.com, сентябрь 2026). CNAME для `www` указывает на `dext01.github.io` **без** имени
репозитория. Запросы на `www.voice-mind.ru` GitHub сам перенаправит на `voice-mind.ru`.

Если в зоне есть **CAA**-записи, в них должен быть разрешён `letsencrypt.org`, иначе GitHub
не сможет выпустить HTTPS-сертификат. Если CAA-записей нет, ничего делать не нужно.

### Если DNS домена обслуживает не Selectel

Проверить, какие NS у домена сейчас:

```bash
dig NS voice-mind.ru +short
```

- Если это NS Selectel, всё правильно: добавляйте записи, как описано выше.
- Если это NS другого провайдера (например, парковка регистратора или Cloudflare), есть два варианта:
  1. добавить те же записи у этого провайдера;
  2. или перенести DNS в Selectel: **DNS-хостинг → Добавить зону `voice-mind.ru`**.
     Selectel покажет свои NS-серверы. Их надо прописать у домена: панель Selectel →
     **Домены** → `voice-mind.ru` → **NS-серверы** (или «Изменить DNS-серверы»).
     Смена NS для `.ru` обычно доходит за несколько часов, иногда до суток.

## 4. Подтвердить домен в аккаунте GitHub (защита от угона домена)

1. GitHub → аватар → **Settings** (настройки аккаунта, не репозитория) → **Pages** →
   **Add a domain** → `voice-mind.ru`.
2. GitHub покажет TXT-запись вида:
   - имя: `_github-pages-challenge-dext01.voice-mind.ru`
     (в панели Selectel в поле «имя» обычно пишут `_github-pages-challenge-dext01`);
   - значение: случайная строка из GitHub.
3. Добавьте эту TXT-запись в Selectel, подождите несколько минут и нажмите **Verify**.

Проверка:

```bash
dig TXT _github-pages-challenge-dext01.voice-mind.ru +short
```

После верификации TXT-запись не удаляйте.

## 5. Указать custom domain в репозитории

Файл `CNAME` лежит в репозитории для порядка, но **при деплое через GitHub Actions GitHub его
игнорирует**. Домен нужно указать в настройках:

**Settings → Pages → Custom domain → `voice-mind.ru` → Save**

или

```bash
gh api -X PUT repos/dext01/voicemind-site/pages -f cname=voice-mind.ru
```

GitHub проверит DNS (появится «DNS check successful») и начнёт выпускать сертификат Let's Encrypt.
Обычно это занимает от 15 минут до часа, изредка до суток.

## 6. Включить HTTPS

Когда сертификат выпущен, галочка **Enforce HTTPS** в Settings → Pages станет активной. Включите её:

```bash
gh api -X PUT repos/dext01/voicemind-site/pages -F https_enforced=true
```

Если галочка долго остаётся неактивной: уберите custom domain, сохраните и укажите его снова.
Это перезапускает выпуск сертификата.

## 7. Проверка

```bash
dig voice-mind.ru +short          # 4 адреса 185.199.108-111.153
dig AAAA voice-mind.ru +short     # 4 адреса 2606:50c0:800X::153
dig www.voice-mind.ru +short      # dext01.github.io. + те же IP
dig @8.8.8.8 voice-mind.ru +short # то же через внешний резолвер
curl -sI https://voice-mind.ru | head -n 5            # HTTP/2 200, server: GitHub.com
curl -sI http://www.voice-mind.ru | grep -i location  # редирект на voice-mind.ru
gh api repos/dext01/voicemind-site/pages              # status: built, cname, https_enforced
```

Сколько ждать:
- новые записи в зоне Selectel обычно видны через 5–30 минут, но из-за кэша у провайдеров
  может уйти время до истечения TTL, то есть до часа;
- при смене NS-серверов домена — до 24 часов (для `.ru` иногда до 48);
- сертификат выпускается, когда DNS уже указывает на GitHub, — ещё от 15 минут до часа.

## Содержание

Сейчас сайт — визитка закрытого пилота: без ссылок на скачивание. Контакт для участия —
ссылка в разделе «Сейчас» (`#pilot` в `index.html`). Шрифты (Cormorant Garamond, Inter)
лежат в `assets/fonts/` — Google Fonts из России грузится нестабильно.

## Обновление сайта

Правите файлы, затем `git commit` и `git push`. Workflow сам выложит новую версию за 1–2 минуты.
