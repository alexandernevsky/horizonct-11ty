# Примеры компонентов для Nuxt 3

Готовые компоненты с Tailwind стилями и Vue динамикой (без Webflow JS).

## 📦 Установка зависимостей

```bash
npm install @vueuse/core @vueuse/nuxt
```

## 🎨 Компоненты

### 1. Button

```vue
<!-- components/Button.vue -->
<template>
  <button 
    :type="type"
    :disabled="disabled"
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
    validator: (v) => ['default', 'outline', 'ghost', 'secondary', 'danger'].includes(v)
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  },
  type: {
    type: String,
    default: 'button'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const buttonClasses = computed(() => {
  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    default: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary',
    outline: 'border-2 border-primary text-primary hover:bg-primary/10 focus:ring-primary',
    ghost: 'text-primary hover:bg-primary/10 focus:ring-primary',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
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

**Использование:**
```vue
<Button variant="default" size="lg">Click me</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
```

---

### 2. Dropdown

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
      :disabled="disabled"
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
        class="absolute z-50 mt-1 w-full min-w-[200px] overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        role="listbox"
      >
        <li
          v-for="option in options"
          :key="option.value"
          @click="select(option)"
          :class="[
            'cursor-pointer px-4 py-2 text-sm transition-colors',
            modelValue === option.value 
              ? 'bg-primary/10 text-primary font-medium' 
              : 'hover:bg-gray-100'
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
import { onClickOutside } from '@vueuse/core'

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
  },
  disabled: {
    type: Boolean,
    default: false
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
  if (!props.disabled) {
    isOpen.value = !isOpen.value
  }
}

const select = (option) => {
  emit('update:modelValue', option.value)
  emit('change', option)
  isOpen.value = false
}

onClickOutside(dropdownRef, () => {
  isOpen.value = false
})

const buttonClasses = computed(() => {
  return [
    'flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
    props.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
  ].join(' ')
})
</script>
```

**Использование:**
```vue
<script setup>
const selectedLang = ref('en')
const langOptions = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' }
]
</script>

<template>
  <Dropdown 
    v-model="selectedLang" 
    :options="langOptions"
    placeholder="Select language"
  />
</template>
```

---

### 3. Navigation Menu с Dropdown

```vue
<!-- components/NavigationMenu.vue -->
<template>
  <nav class="relative">
    <ul class="flex items-center gap-1">
      <li v-for="item in items" :key="item.href || item.title" class="relative">
        <!-- Простая ссылка -->
        <NuxtLink
          v-if="!item.children || item.children.length === 0"
          :to="item.href"
          class="inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
          active-class="bg-gray-100"
        >
          {{ item.title }}
        </NuxtLink>
        
        <!-- Ссылка с dropdown -->
        <div 
          v-else 
          class="relative" 
          @mouseenter="openDropdown(item.href)" 
          @mouseleave="closeDropdown"
        >
          <button
            @click="toggleDropdown(item.href)"
            class="inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
            :class="{ 'bg-gray-100': openDropdowns.includes(item.href) }"
          >
            {{ item.title }}
            <svg 
              class="ml-1 h-4 w-4 transition-transform duration-200"
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
              class="absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-md border border-gray-200 bg-white p-1 shadow-lg"
            >
              <NuxtLink
                v-for="child in item.children"
                :key="child.href"
                :to="child.href"
                class="block rounded-md px-3 py-2 text-sm transition-colors hover:bg-gray-100"
              >
                <div class="font-medium">{{ child.title }}</div>
                <div v-if="child.description" class="text-xs text-gray-500 mt-0.5">
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
<script setup>
const navItems = [
  { title: 'Home', href: '/' },
  { 
    title: 'About', 
    href: '/about',
    children: [
      { title: 'Our Story', href: '/about', description: 'Learn about us' },
      { title: 'Team', href: '/about#team', description: 'Meet the team' }
    ]
  },
  { title: 'Contact', href: '/contact' }
]
</script>

<template>
  <NavigationMenu :items="navItems" />
</template>
```

---

### 4. Modal

```vue
<!-- components/Modal.vue -->
<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="close"
      >
        <Transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="modelValue"
            class="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
          >
            <button
              v-if="showClose"
              @click="close"
              class="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <slot />
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  showClose: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

// Закрытие по Escape
onMounted(() => {
  const handleEscape = (e) => {
    if (e.key === 'Escape' && props.modelValue) {
      close()
    }
  }
  window.addEventListener('keydown', handleEscape)
  onUnmounted(() => {
    window.removeEventListener('keydown', handleEscape)
  })
})
</script>
```

**Использование:**
```vue
<script setup>
const isModalOpen = ref(false)
</script>

<template>
  <Button @click="isModalOpen = true">Open Modal</Button>
  
  <Modal v-model="isModalOpen">
    <h2 class="text-2xl font-bold mb-4">Modal Title</h2>
    <p class="text-gray-600 mb-4">Modal content goes here</p>
    <Button @click="isModalOpen = false">Close</Button>
  </Modal>
</template>
```

---

### 5. Accordion

```vue
<!-- components/Accordion.vue -->
<template>
  <div class="border-b border-gray-200">
    <button
      @click="toggle"
      class="flex w-full items-center justify-between py-4 text-left font-medium transition-colors hover:text-primary"
    >
      <span>{{ title }}</span>
      <svg 
        class="h-5 w-5 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
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
      <div v-if="isOpen" class="overflow-hidden pb-4 text-gray-600">
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  defaultOpen: {
    type: Boolean,
    default: false
  }
})

const isOpen = ref(props.defaultOpen)

const toggle = () => {
  isOpen.value = !isOpen.value
}
</script>
```

**Использование:**
```vue
<Accordion title="Question 1">
  <p>Answer to question 1</p>
</Accordion>
<Accordion title="Question 2">
  <p>Answer to question 2</p>
</Accordion>
```

---

### 6. Tabs

```vue
<!-- components/Tabs.vue -->
<template>
  <div>
    <div class="border-b border-gray-200">
      <nav class="-mb-px flex space-x-8">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="selectTab(tab.id)"
          :class="[
            'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors',
            activeTab === tab.id
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          ]"
        >
          {{ tab.label }}
        </button>
      </nav>
    </div>
    <div class="mt-4">
      <slot :activeTab="activeTab" />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  tabs: {
    type: Array,
    required: true,
    validator: (tabs) => {
      return tabs.every(tab => tab.id !== undefined && tab.label !== undefined)
    }
  },
  defaultTab: {
    type: [String, Number],
    default: null
  }
})

const activeTab = ref(props.defaultTab || props.tabs[0]?.id)

const selectTab = (tabId) => {
  activeTab.value = tabId
}
</script>
```

**Использование:**
```vue
<script setup>
const tabs = [
  { id: 'tab1', label: 'Tab 1' },
  { id: 'tab2', label: 'Tab 2' },
  { id: 'tab3', label: 'Tab 3' }
]
</script>

<template>
  <Tabs :tabs="tabs">
    <template #default="{ activeTab }">
      <div v-if="activeTab === 'tab1'">Content 1</div>
      <div v-if="activeTab === 'tab2'">Content 2</div>
      <div v-if="activeTab === 'tab3'">Content 3</div>
    </template>
  </Tabs>
</template>
```

---

## 🎨 Настройка цветов из Webflow

После извлечения цветов из Webflow, добавьте их в `tailwind.config.js`:

```js
export default {
  theme: {
    extend: {
      colors: {
        // Ваши цвета из Webflow
        primary: {
          DEFAULT: '#6366f1',  // основной цвет
          light: '#818cf8',
          dark: '#4f46e5',
        },
        // Дополнительные цвета
        accent: '#4ecdc4',
        brand: '#ff6b6b',
      }
    }
  }
}
```

Теперь используйте в компонентах:
```vue
<div class="bg-primary text-white">Primary color</div>
<div class="bg-primary-light">Light variant</div>
<div class="bg-primary-dark">Dark variant</div>
```

---

## 📝 Примечания

- Все компоненты используют **чистый Tailwind CSS**
- Вся динамика на **Vue 3 Composition API**
- Используется **@vueuse/core** для утилит (`onClickOutside`)
- **Transitions** встроены в Vue
- **Никакого Webflow JS** - только стили из Webflow → Tailwind config

