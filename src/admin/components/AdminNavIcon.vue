<script setup lang="ts">
defineProps<{ name: 'overview' | 'projects' | 'designs' | 'customers' | 'quotes' | 'products' | 'operations' | 'store' | 'settings' }>();
</script>

<template>
  <svg
    class="side-nav-icon"
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <template v-if="name === 'overview'">
      <rect x="3" y="3" width="7" height="7" rx="1.6" />
      <rect x="14" y="3" width="7" height="7" rx="1.6" />
      <rect x="3" y="14" width="7" height="7" rx="1.6" />
      <rect x="14" y="14" width="7" height="7" rx="1.6" />
    </template>
    <template v-else-if="name === 'projects'">
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.2l2 2H18.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
      <path d="m9 13 2 2 4-4" />
    </template>
    <template v-else-if="name === 'designs'">
      <rect x="3" y="3" width="18" height="18" rx="1.8" />
      <path d="M3 10h7V3M10 10h11M14 21v-7h7" />
    </template>
    <template v-else-if="name === 'customers'">
      <path d="M16 21v-1.8a4 4 0 0 0-4-4H6.2a4 4 0 0 0-4 4V21" />
      <circle cx="9.1" cy="7.2" r="3.6" />
      <path d="M21.8 21v-1.8a4 4 0 0 0-3-3.86M16.2 3.4a3.6 3.6 0 0 1 0 6.98" />
    </template>
    <template v-else-if="name === 'quotes'">
      <path d="M6 3h12v18l-3-1.8-3 1.8-3-1.8L6 21z" />
      <path d="M9 8h6M9 12h6M9 16h3.5" />
    </template>
    <template v-else-if="name === 'products'">
      <path d="m12 3 8.5 4.5v9L12 21l-8.5-4.5v-9z" />
      <path d="m3.5 7.5 8.5 4.5 8.5-4.5M12 12v9" />
      <path d="m7.75 5.25 8.5 4.5" />
    </template>
    <template v-else-if="name === 'operations'">
      <path d="M4 20v-8M10 20V5M16 20v-6M22 20H2" />
    </template>
    <template v-else-if="name === 'store'">
      <path d="M4 10v10h16V10" />
      <path d="M3 10 5 4h14l2 6" />
      <path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
      <path d="M9.5 20v-5.5h5V20" />
    </template>
    <template v-else>
      <path d="M4 20v-6M4 10V4M12 20v-9M12 7V4M20 20v-4M20 12V4" />
      <path d="M2 14h4M10 7h4M18 12h4" />
    </template>
  </svg>
</template>
