# Как загрузить Lemma на GitHub и задеплоить

## Что тебе нужно

- Аккаунт на GitHub (github.com)
- Node.js 18+ установленный локально (nodejs.org)
- Git установленный локально

---

## Шаг 1 — Создай репозиторий на GitHub

1. Открой github.com → войди в аккаунт
2. Нажми кнопку **«New»** (или зелёную кнопку **+** → New repository)
3. Назови репозиторий: `Lemma` (именно так, с большой W и P — важно для PWA)
4. Выбери **Public**
5. **НЕ** ставь галочки на README/gitignore/.gitignore — они уже есть
6. Нажми **«Create repository»**

---

## Шаг 2 — Скопируй папку проекта к себе

Папка `Lemma` уже у тебя на компьютере (та папка, которую ты выбрал для Cowork).

---

## Шаг 3 — Открой терминал в папке проекта

**На Mac:**
- Открой Finder → найди папку `Lemma`
- Правой кнопкой → «Новый терминал в папке»

**На Windows:**
- Открой папку `Lemma` в проводнике
- В адресной строке набери `cmd` и Enter

---

## Шаг 4 — Установи зависимости и собери проект

```bash
npm install
npm run build
```

Это создаст папку `dist/` с готовым сайтом.

---

## Шаг 5 — Загрузи код на GitHub

```bash
git init
git add .
git commit -m "Initial commit — Lemma PWA"
git branch -M main
git remote add origin https://github.com/ТУТ_ТВОЙ_НИКНЕЙМ/Lemma.git
git push -u origin main
```

Замени `ТУТ_ТВОЙ_НИКНЕЙМ` на твой GitHub username.

---

## Шаг 6 — Настрой GitHub Pages

1. Открой репозиторий на GitHub
2. Зайди в **Settings** (вкладка сверху)
3. Слева найди **Pages**
4. В разделе **Source** выбери **GitHub Actions**
5. Создай файл `.github/workflows/deploy.yml` — или используй готовый ниже

---

## Файл деплоя (создай его вручную)

Создай в проекте путь `.github/workflows/deploy.yml` и вставь:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - uses: actions/deploy-pages@v4
        id: deployment
```

После того как добавишь этот файл и запушишь — GitHub автоматически задеплоит приложение.

---

## Шаг 7 — Добавь файл деплоя и задеплой

```bash
# Создай папку .github/workflows/
mkdir -p .github/workflows

# Скопируй deploy.yml туда (содержимое выше)
# ...

# Запушь
git add .
git commit -m "Add GitHub Actions deploy workflow"
git push
```

---

## Шаг 8 — Открой приложение

После успешного деплоя приложение будет доступно по адресу:

```
https://ТУТ_ТВОЙ_НИКНЕЙМ.github.io/Lemma/
```

Примерно через 1–2 минуты после пуша.

---

## Установка на iPhone

1. Открой ссылку в **Safari** (именно Safari, не Chrome!)
2. Нажми кнопку «Поделиться» (квадрат со стрелкой вверх)
3. Выбери **«На экран «Домой»»**
4. Назови «Lemma» → нажми «Добавить»

Приложение встанет на рабочий стол как обычное приложение 🚀

---

## Если что-то пошло не так

**Ошибка `npm install`** — убедись что Node.js установлен: `node -v`

**Ошибка `git remote`** — убедись что вставил правильный URL репозитория

**Пустая страница после деплоя** — проверь что в `vite.config.ts` стоит `base: '/Lemma/'` — так и есть, всё хорошо

**PWA не устанавливается** — только Safari на iPhone поддерживает установку PWA
