# iOS Build — Lemma

Нативная обёртка через Capacitor. Bundle ID: `com.emorozoff.wordpunk`.

## Требования

- macOS с установленным Xcode (16+)
- Apple ID (бесплатный) — для подписи и установки на свой iPhone (срок 7 дней)
- Apple Developer Program ($99/год) — нужно только для TestFlight и App Store

## Первая сборка

```bash
# 1. Зависимости
npm install

# 2. Собрать веб + синхронизировать в iOS-проект
npm run ios:sync

# 3. Открыть в Xcode (запустит cap sync + откроет .xcworkspace)
npm run ios:open
```

В Xcode:
1. Выбрать проект **App** в навигаторе
2. **Signing & Capabilities** → **Team** → выбрать свой Apple ID
3. **Bundle Identifier**: `com.emorozoff.wordpunk` (можно сменить, если занят)
4. Подключить iPhone по USB → выбрать его в верхней панели
5. **⌘R** (Run) → приложение собирается, ставится, запускается

При первом запуске на iPhone:
- iOS попросит «Доверять разработчику»: **Settings → General → VPN & Device Management → [Apple ID] → Trust**
- Сертификат бесплатного аккаунта живёт **7 дней** — потом надо переподписывать через Xcode

## Регулярный цикл разработки

После любых правок в `src/`:

```bash
npm run ios:sync   # ребилд + копирование в ios/App/App/public
```

В Xcode жмёшь **⌘R** — обновлённая версия установится.

Live-reload через dev-server: можно настроить через `capacitor.config.ts → server.url`, но для этого пока не нужно.

## Иконка и splash

Источники в `resources/`:
- `icon-only.png` — 1024×1024 (App Store icon)
- `icon-background.png` — 1024×1024
- `splash.png`, `splash-dark.png` — 2732×2732

Регенерация всех нативных размеров:

```bash
python3 scripts/generate-app-icon.py    # из исходника
npm run assets:generate                  # все размеры для iOS
npm run ios:sync
```

## Проверка перед TestFlight

- [ ] App ID согласован: `capacitor.config.ts` ↔ Xcode Bundle Identifier
- [ ] Версия в `MainScreen.tsx` совпадает с CFBundleShortVersionString в Xcode
- [ ] Тест на физическом iPhone (симулятор не показывает haptics)
- [ ] Аудио R2 работает (нужен интернет — это пока нормально)
- [ ] Splash screen не белый → тёмный (#0d0d0d), без вспышек
- [ ] Safe area: контент не залезает под нотч и под home-indicator
- [ ] Status bar — белые иконки на тёмном фоне

## TestFlight (требует $99 Apple Developer Program)

1. В Xcode → **Product → Archive**
2. **Distribute App → App Store Connect → Upload**
3. На [appstoreconnect.apple.com](https://appstoreconnect.apple.com): выбрать билд → TestFlight → пригласить тестировщиков по email/ссылке

## Структура

```
resources/                    # источники иконки/сплэша (1024×1024, 2732×2732)
ios/App/App.xcworkspace       # ← открывать в Xcode (НЕ .xcodeproj!)
ios/App/App/public/           # копия dist/ (генерится автоматически — .gitignore)
ios/App/App/Assets.xcassets   # сгенерированные иконки и splash
capacitor.config.ts           # bundle ID, плагины, splash/statusbar
src/lib/native.ts             # обёртки haptics/status-bar/splash (no-op на web)
```

## Что точно работает в нативе

- Pre-generated MP3 с R2 CDN (та же логика, что в PWA)
- Haptics на верном/неверном ответе
- Тёмный status bar
- Splash screen (без белой вспышки)

## Что НЕ работает в офлайне (пока)

- Аудио — требует интернета. Нужно реализовать офлайн-кеш в Settings (план).
