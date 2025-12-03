# shadcn/ui Components для Eleventy + Alpine.js

Этот проект использует адаптированные компоненты на основе [shadcn/ui](https://ui.shadcn.com/), переписанные для работы с **Eleventy (Nunjucks)** и **Alpine.js**.

## ✅ Установлено

- ✅ Цветовая схема shadcn/ui в `tailwind.config.js`
- ✅ CSS переменные для темизации в `tailwind.css`
- ✅ Компоненты: Button, Select, Navigation Menu, Skeleton
- ✅ Typography стили

## 📦 Компоненты

### Button

```nunjucks
{% set buttonVariant = "default" %} {# default | destructive | outline | secondary | ghost | link #}
{% set buttonSize = "default" %} {# default | sm | lg | icon #}
{% set buttonContent = "Click me" %}
{% include "components/button.html" %}
```

**Варианты:**
- `default` - основная кнопка (синяя)
- `destructive` - для опасных действий (красная)
- `outline` - с рамкой
- `secondary` - вторичная кнопка
- `ghost` - без фона
- `link` - как ссылка

**Размеры:**
- `sm` - маленькая
- `default` - стандартная
- `lg` - большая
- `icon` - квадратная для иконок

**Пример:**
```nunjucks
{% set buttonVariant = "default" %}
{% set buttonSize = "lg" %}
{% set buttonContent = "Submit" %}
{% set buttonType = "submit" %}
{% include "components/button.html" %}
```

### Select (Dropdown)

```nunjucks
{% set selectId = "language-select" %}
{% set selectOptions = [
  {"value": "en", "label": "English"},
  {"value": "ru", "label": "Русский"}
] %}
{% set selectValue = "en" %}
{% set selectPlaceholder = "Select language..." %}
{% include "components/select.html" %}
```

**Пример использования:**
```nunjucks
{% set selectId = "lang-switcher" %}
{% set selectOptions = [
  {"value": "/", "label": "English"},
  {"value": "/ru/", "label": "Русский"}
] %}
{% set selectValue = page.url %}
{% set selectOnChange = "window.location.href = value" %}
{% include "components/select.html" %}
```

### Navigation Menu

```nunjucks
{% set navItems = [
  {
    "title": "Home",
    "href": "/",
    "children": []
  },
  {
    "title": "About",
    "href": "/about/",
    "children": [
      {"title": "Our Story", "href": "/about/", "description": "Learn about our history"},
      {"title": "Team", "href": "/about/#team", "description": "Meet our team"}
    ]
  }
] %}
{% include "components/navigation-menu.html" %}
```

### Skeleton

```nunjucks
{% set skeletonClass = "h-4 w-full" %}
{% include "components/skeleton.html" %}
```

**Примеры:**
```nunjucks
{# Загрузка текста #}
{% set skeletonClass = "h-4 w-[250px]" %}
{% include "components/skeleton.html" %}

{# Загрузка карточки #}
<div class="space-y-2">
  {% set skeletonClass = "h-4 w-full" %}
  {% include "components/skeleton.html" %}
  {% set skeletonClass = "h-4 w-3/4" %}
  {% include "components/skeleton.html" %}
</div>
```

## 🎨 Typography

Используйте классы для типографики:

```html
<p class="typography-lead">Lead text - для вводных абзацев</p>
<div class="typography-large">Large text - для заголовков</div>
<small class="typography-small">Small text - для мелкого текста</small>
<p class="typography-muted">Muted text - для второстепенного текста</p>
<code class="typography-inline-code">inline code</code>
<ul class="typography-list">
  <li>Item 1</li>
  <li>Item 2</li>
</ul>
<blockquote class="typography-blockquote">Quote text</blockquote>
```

## 🎨 Цветовая схема

Все цвета определены через CSS переменные и автоматически поддерживают dark mode:

- `bg-background` / `text-foreground` - основной фон и текст
- `bg-primary` / `text-primary-foreground` - основные цвета
- `bg-secondary` / `text-secondary-foreground` - вторичные цвета
- `bg-muted` / `text-muted-foreground` - приглушенные цвета
- `bg-accent` / `text-accent-foreground` - акцентные цвета
- `bg-destructive` / `text-destructive-foreground` - для ошибок/удаления

## 🔄 Совместимость

- ✅ **Tailwind CSS** - полностью совместим
- ✅ **Alpine.js** - все интерактивные компоненты используют Alpine.js
- ✅ **Dark Mode** - автоматическая поддержка через `dark:` классы
- ✅ **Eleventy** - компоненты работают как Nunjucks includes
- ✅ **Netlify CMS** - можно использовать в CMS контенте

## 📝 Примеры использования

### Форма с shadcn/ui стилями

```nunjucks
<form class="space-y-4">
  <div>
    <label class="text-sm font-medium leading-none">Email</label>
    <input type="email" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
  </div>
  
  {% set buttonVariant = "default" %}
  {% set buttonContent = "Submit" %}
  {% set buttonType = "submit" %}
  {% include "components/button.html" %}
</form>
```

## 🚀 Следующие шаги

1. Обновить существующие формы с новыми стилями
2. Заменить navbar на Navigation Menu компонент
3. Добавить Skeleton для страниц загрузки
4. Использовать Button компонент везде вместо обычных кнопок

