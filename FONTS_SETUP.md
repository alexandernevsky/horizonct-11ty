# Установка локальных шрифтов

Шрифты устанавливаются через npm пакеты и автоматически копируются при сборке.

## Установка

Шрифты уже установлены через npm:
```bash
npm install geist @fontsource/eb-garamond
```

## Автоматическое копирование

При сборке проекта (`npm run build`) шрифты автоматически копируются из `node_modules` в `_site/static/fonts/`:

- **Geist**: `node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2` → `_site/static/fonts/geist/Geist-Variable.woff2`
- **EB Garamond**: файлы из `node_modules/@fontsource/eb-garamond/files/` → `_site/static/fonts/eb-garamond/`

## Структура после сборки

```
_site/static/fonts/
├── geist/
│   └── Geist-Variable.woff2
└── eb-garamond/
    ├── eb-garamond-latin-400-normal.woff2
    ├── eb-garamond-latin-400-italic.woff2
    ├── eb-garamond-latin-800-normal.woff2
    └── eb-garamond-latin-800-italic.woff2
```

## Проверка

После установки пакетов запустите:
```bash
npm run build
```

Шрифты будут автоматически скопированы и доступны на сайте.

## Обновление шрифтов

Для обновления шрифтов до последних версий:
```bash
npm update geist @fontsource/eb-garamond
```

