# План миграции на Nuxt 3

## 🎯 Стратегия

### Подход: Webflow CSS → Tailwind + Vue динамика

**Решение:** 
- ✅ Из Webflow берем **ТОЛЬКО CSS стили** (цвета, отступы, типографика, размеры)
- ✅ Верстка на **чистом Tailwind** с классами
- ✅ Вся динамика (dropdowns, меню, интерактивность) на **Vue 3 Composition API**
- ❌ Webflow JS **полностью игнорируем**

## 📋 Пошаговый план

### Этап 1: Подготовка Nuxt проекта

1. **Создать Nuxt 3 проект** (используя ваш бесплатный стартер)
   ```bash
   npx nuxi@latest init nuxt-project
   ```

2. **Настроить Tailwind CSS**
   - Установить `@nuxtjs/tailwindcss`
   - Настроить `tailwind.config.js` (можно взять из текущего проекта)
   - Настроить цветовую схему (без shadcn переменных, если не нужны)

3. **Структура папок**
   ```
   nuxt-project/
   ├── components/        # Vue компоненты
   ├── pages/            # Страницы (автоматический роутинг)
   ├── layouts/          # Layouts
   ├── composables/      # Composables для логики
   ├── assets/           # Статические файлы
   │   ├── css/
   │   └── images/
   └── public/           # Публичные файлы
   ```

### Этап 2: Перенос контента

1. **Структура данных**
   - Перенести `src/_data/` → `nuxt-project/content/` или `nuxt-project/data/`
   - Использовать Nuxt Content или JSON/YAML файлы

2. **Страницы**
   - `src/en/index.html` → `nuxt-project/pages/index.vue`
   - `src/en/about/` → `nuxt-project/pages/about.vue`
   - `src/en/news/` → `nuxt-project/pages/news/` (динамические роуты)
   - И т.д.

3. **Многоязычность**
   - Использовать `@nuxtjs/i18n` модуль
   - Структура: `pages/[lang]/about.vue` или через i18n routing

### Этап 3: Извлечение стилей из Webflow и применение в Tailwind

**Процесс работы с Webflow:**

1. **Экспорт из Webflow**
   - Project Settings → Export Code
   - Скачиваете HTML + CSS (JS не нужен!)

2. **Извлечение стилей**
   - Открываете экспортированный CSS файл
   - Или смотрите в DevTools при просмотре страницы в Webflow
   - Выписываете ключевые значения:
     - Цвета (hex/rgb)
     - Отступы (padding, margin)
     - Размеры шрифтов
     - Border radius
     - Тени (box-shadow)
     - Градиенты

3. **Применение в Tailwind config**

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        // Из Webflow CSS находите цвета и добавляете сюда
        primary: {
          DEFAULT: '#6366f1',  // ваш цвет из Webflow
          light: '#818cf8',
          dark: '#4f46e5',
        },
        // Или если в Webflow используются конкретные цвета:
        brand: '#ff6b6b',
        accent: '#4ecdc4',
      },
      spacing: {
        // Если нужны специфичные отступы из Webflow
        'section': '80px',
        'hero': '120px',
      },
      fontSize: {
        // Если нужны точные размеры шрифтов из Webflow
        'hero': ['64px', { lineHeight: '1.1' }],
      },
      borderRadius: {
        // Если нужны специфичные радиусы
        'card': '12px',
      }
    },
  },
}
```

4. **Использование в компонентах**

```vue
<!-- Пример: Hero секция -->
<template>
  <!-- Стили из Webflow переводим в Tailwind классы -->
  <section class="bg-gradient-to-br from-primary to-primary-dark py-hero">
    <div class="container mx-auto px-4">
      <h1 class="text-hero font-bold text-white">
        {{ title }}
      </h1>
    </div>
  </section>
</template>
```

**Инструменты:**
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) - автодополнение классов
- DevTools в браузере - для точного копирования значений из Webflow

### Этап 4: Компоненты с динамикой на Vue

**Создать переиспользуемые компоненты с Vue реактивностью:**

#### Button (простой компонент)

```vue
<!-- components/Button.vue -->
<template>
  <button 
    :class="buttonClasses"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (v) => ['default', 'outline', 'ghost', 'secondary'].includes(v)
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  }
})

const buttonClasses = computed(() => {
  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
  const variants = {
    default: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary',
    outline: 'border-2 border-primary text-primary hover:bg-primary/10 focus:ring-primary',
    ghost: 'text-primary hover:bg-primary/10 focus:ring-primary',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500'
  }
  const sizes = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3'
  }
  return `${base} ${variants[props.variant]} ${sizes[props.size]}`
})
</script>
```

#### Dropdown (с Vue динамикой)

```vue
<!-- components/Dropdown.vue -->
<template>
  <div class="relative" ref="dropdownRef">
    <button
      type="button"
      @click="toggle"
      :class="buttonClasses"
      :aria-expanded="isOpen"
      aria-haspopup="true"
    >
      <span>{{ selectedLabel }}</span>
      <svg 
        class="ml-2 h-4 w-4 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <ul
        v-if="isOpen"
        class="absolute z-50 mt-1 w-full min-w-[200px] overflow-auto rounded-md border bg-white py-1 shadow-lg"
        role="listbox"
      >
        <li
          v-for="option in options"
          :key="option.value"
          @click="select(option)"
          :class="[
            'cursor-pointer px-4 py-2 text-sm hover:bg-gray-100',
            { 'bg-gray-100': modelValue === option.value }
          ]"
          role="option"
        >
          {{ option.label }}
        </li>
      </ul>
    </Transition>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  options: {
    type: Array,
    required: true,
    validator: (options) => {
      return options.every(opt => opt.value !== undefined && opt.label !== undefined)
    }
  },
  placeholder: {
    type: String,
    default: 'Select...'
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const isOpen = ref(false)
const dropdownRef = ref(null)

const selectedLabel = computed(() => {
  const option = props.options.find(opt => opt.value === props.modelValue)
  return option?.label || props.placeholder
})

const toggle = () => {
  isOpen.value = !isOpen.value
}

const select = (option) => {
  emit('update:modelValue', option.value)
  emit('change', option)
  isOpen.value = false
}

// Закрытие при клике вне компонента
onClickOutside(dropdownRef, () => {
  isOpen.value = false
})

const buttonClasses = computed(() => {
  return 'flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
})
</script>
```

#### Navigation Menu с Dropdown

```vue
<!-- components/NavigationMenu.vue -->
<template>
  <nav class="relative">
    <ul class="flex items-center gap-1">
      <li v-for="item in items" :key="item.href" class="relative">
        <!-- Простая ссылка -->
        <NuxtLink
          v-if="!item.children || item.children.length === 0"
          :to="item.href"
          class="inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
        >
          {{ item.title }}
        </NuxtLink>
        
        <!-- Ссылка с dropdown -->
        <div v-else class="relative" @mouseenter="openDropdown(item.href)" @mouseleave="closeDropdown">
          <button
            @click="toggleDropdown(item.href)"
            class="inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
            :class="{ 'bg-gray-100': openDropdowns.includes(item.href) }"
          >
            {{ item.title }}
            <svg 
              class="ml-1 h-4 w-4 transition-transform"
              :class="{ 'rotate-180': openDropdowns.includes(item.href) }"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <Transition
            enter-active-class="transition ease-out duration-100"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="openDropdowns.includes(item.href)"
              class="absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-md border bg-white p-1 shadow-lg"
            >
              <NuxtLink
                v-for="child in item.children"
                :key="child.href"
                :to="child.href"
                class="block rounded-md px-3 py-2 text-sm hover:bg-gray-100"
              >
                <div class="font-medium">{{ child.title }}</div>
                <div v-if="child.description" class="text-xs text-gray-500">
                  {{ child.description }}
                </div>
              </NuxtLink>
            </div>
          </Transition>
        </div>
      </li>
    </ul>
  </nav>
</template>

<script setup>
const props = defineProps({
  items: {
    type: Array,
    required: true
  }
})

const openDropdowns = ref([])

const toggleDropdown = (href) => {
  const index = openDropdowns.value.indexOf(href)
  if (index > -1) {
    openDropdowns.value.splice(index, 1)
  } else {
    openDropdowns.value.push(href)
  }
}

const openDropdown = (href) => {
  if (!openDropdowns.value.includes(href)) {
    openDropdowns.value.push(href)
  }
}

const closeDropdown = () => {
  openDropdowns.value = []
}
</script>
```

**Использование:**

```vue
<template>
  <!-- Button -->
  <Button variant="default" size="lg">Click me</Button>
  
  <!-- Dropdown -->
  <Dropdown 
    v-model="selectedLang" 
    :options="langOptions"
    placeholder="Select language"
  />
  
  <!-- Navigation -->
  <NavigationMenu :items="navItems" />
</template>

<script setup>
const selectedLang = ref('en')
const langOptions = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' }
]

const navItems = [
  { title: 'Home', href: '/' },
  { 
    title: 'About', 
    href: '/about',
    children: [
      { title: 'Our Story', href: '/about', description: 'Learn about us' },
      { title: 'Team', href: '/about#team', description: 'Meet the team' }
    ]
  }
]
</script>
```

### Этап 5: Интерактивность на Vue

**Вместо Alpine.js и Webflow JS используем:**

1. **Vue 3 Composition API** (встроено в Nuxt)
   - `ref()`, `reactive()`, `computed()` для состояния
   - `watch()`, `watchEffect()` для реактивности

2. **@vueuse/core** - утилиты (аналог Alpine)
   ```bash
   npm install @vueuse/core @vueuse/nuxt
   ```
   - `useClickOutside()` - клик вне элемента
   - `useMediaQuery()` - медиа запросы
   - `useScroll()` - отслеживание скролла
   - `useToggle()` - переключение boolean

3. **Vue Transitions** - вместо Swup
   - Встроенные `<Transition>` и `<TransitionGroup>`
   - Nuxt page transitions

**Примеры:**

```vue
<!-- Модальное окно -->
<template>
  <Transition
    enter-active-class="transition ease-out duration-200"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full">
        <slot />
      </div>
    </div>
  </Transition>
</template>

<script setup>
const props = defineProps({
  isOpen: Boolean
})
</script>
```

```vue
<!-- Аккордеон -->
<template>
  <div>
    <button @click="toggle" class="flex items-center justify-between w-full">
      <span>{{ title }}</span>
      <svg :class="{ 'rotate-180': isOpen }" class="transition-transform">
        <!-- chevron icon -->
      </svg>
    </button>
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 max-h-0"
      enter-to-class="opacity-100 max-h-screen"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 max-h-screen"
      leave-to-class="opacity-0 max-h-0"
    >
      <div v-if="isOpen" class="overflow-hidden">
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script setup>
const props = defineProps({
  title: String
})

const isOpen = ref(false)
const toggle = () => isOpen.value = !isOpen.value
</script>
```

**Nuxt Page Transitions:**

```vue
<!-- layouts/default.vue -->
<template>
  <div>
    <NuxtPage />
  </div>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
```

## 🎨 Tailwind конфигурация

**Минимальная конфигурация (без shadcn):**

```js
// tailwind.config.js
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366f1', // ваши цвета из Webflow
          // ...
        }
      },
      fontFamily: {
        sans: ['Geist', 'sans-serif'],
        serif: ['EB Garamond', 'serif'],
      }
    },
  },
  plugins: [],
}
```

## 📦 Рекомендуемые Nuxt модули

```bash
# Основные (обязательно)
npm install @nuxtjs/tailwindcss   # Tailwind CSS
npm install @vueuse/nuxt          # Утилиты для Vue (useClickOutside и т.д.)

# Многоязычность
npm install @nuxtjs/i18n

# Контент (если нужен MD контент)
npm install @nuxt/content

# Опционально
npm install @nuxtjs/seo           # SEO оптимизация
npm install @nuxtjs/color-mode    # Dark mode поддержка
npm install @nuxt/image           # Оптимизация изображений
```

**nuxt.config.ts:**
```ts
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
    '@nuxtjs/i18n',
    // остальные модули
  ],
  
  // Tailwind автоматически подключится
  // VueUse автоматически подключится
})
```

## ⚡ Производительность

**Оптимизации:**
1. Использовать `<NuxtImg>` для изображений (автоматическая оптимизация)
2. Lazy loading компонентов: `<LazyComponent />`
3. Code splitting через динамические импорты
4. PurgeCSS автоматически удалит неиспользуемые Tailwind классы

## 🔄 Процесс работы с Webflow

**Оптимальный workflow:**

1. **Дизайн в Webflow**
   - Создаете/обновляете дизайн
   - Добиваетесь пиксельной точности
   - Тестируете интерактивность в Webflow (чтобы понять поведение)

2. **Извлечение стилей**
   - Открываете страницу в Webflow в браузере
   - Используете DevTools для инспекции элементов
   - Выписываете значения:
     ```
     Цвета: #6366f1, rgba(99, 102, 241, 0.1)
     Отступы: 80px, 24px, 16px
     Шрифты: 64px/1.1, 24px/1.5, 16px/1.6
     Border radius: 12px, 8px
     Тени: 0 4px 6px rgba(0,0,0,0.1)
     Градиенты: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
     ```

3. **Настройка Tailwind**
   - Добавляете цвета в `tailwind.config.js`
   - Настраиваете spacing, fontSize если нужны точные значения
   - Или используете стандартные Tailwind классы

4. **Создание компонента в Nuxt**
   - Структура HTML из Webflow → Vue template
   - Стили из Webflow → Tailwind классы
   - Интерактивность из Webflow → Vue логика

5. **Тестирование**
   - Сравниваете визуально с Webflow
   - Проверяете интерактивность
   - Корректируете при необходимости

**Пример извлечения стилей:**

```css
/* Webflow CSS */
.hero-section {
  padding: 120px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.heading-1 {
  font-size: 64px;
  line-height: 1.1;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 24px;
}
```

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        hero: {
          start: '#667eea',
          end: '#764ba2'
        }
      },
      spacing: {
        'hero': '120px'
      },
      fontSize: {
        'hero': ['64px', { lineHeight: '1.1' }]
      }
    }
  }
}
```

```vue
<!-- Nuxt компонент -->
<template>
  <section class="py-hero px-6 bg-gradient-to-br from-hero-start to-hero-end">
    <h1 class="text-hero font-bold text-white mb-6">
      {{ title }}
    </h1>
  </section>
</template>
```

## ✅ Чеклист миграции

- [ ] Создать Nuxt 3 проект
- [ ] Настроить Tailwind CSS
- [ ] Перенести структуру данных
- [ ] Создать базовые layouts
- [ ] Перенести главную страницу
- [ ] Перенести остальные страницы
- [ ] Настроить i18n
- [ ] Создать переиспользуемые компоненты
- [ ] Оптимизировать изображения
- [ ] Настроить SEO
- [ ] Протестировать на всех устройствах
- [ ] Настроить деплой

## 🚨 Важные замечания

1. **Webflow JS полностью игнорируем** ❌
   - Не копируем JS файлы из экспорта
   - Вся динамика на Vue

2. **Из Webflow берем ТОЛЬКО CSS стили** ✅
   - Цвета → в `tailwind.config.js`
   - Отступы → Tailwind spacing классы
   - Типографика → Tailwind typography классы
   - Эффекты → Tailwind utility классы

3. **Верстка на чистом Tailwind** ✅
   - Используем Tailwind классы везде
   - Не подключаем Webflow CSS файлы
   - Все стили через Tailwind config

4. **Динамика на Vue** ✅
   - Dropdowns → Vue компоненты с `ref()` и `computed()`
   - Меню → Vue состояние + transitions
   - Формы → Vue reactivity
   - Модалки → Vue transitions

5. **Тестируйте реактивность**
   - Убедитесь что Vue работает корректно
   - Проверьте что нет конфликтов

6. **Оптимизация**
   - Tailwind автоматически удалит неиспользуемые классы
   - Vue code splitting работает автоматически

## 📚 Полезные ресурсы

- [Nuxt 3 Docs](https://nuxt.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Nuxt Content](https://content.nuxtjs.org/) - если нужен MD контент

