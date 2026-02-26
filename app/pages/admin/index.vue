<script setup lang="ts">
definePageMeta({ title: 'Admin Dashboard', middleware: 'auth' })

const { user, loggedIn, loading, logout, refresh } = useAuth()
await refresh()

const isAdmin = computed(() => user.value?.isAdmin ?? false)


async function handleLogout() {
  await logout()
  navigateTo('/')
}

const analytics = [
  {
    label: 'Search Console',
    to: '/admin/gsc',
    icon: 'i-lucide-search',
    color: 'text-blue-500',
    desc: 'Organic search performance',
  },
  {
    label: 'Google Analytics',
    to: '/admin/analytics',
    icon: 'i-lucide-bar-chart-3',
    color: 'text-orange-500',
    desc: 'Visitor behavior & traffic',
  },
  {
    label: 'PostHog',
    to: '/admin/posthog',
    icon: 'i-lucide-zap',
    color: 'text-rose-500',
    desc: 'Product analytics & recordings',
  },
]
</script>

<template>
  <div class="max-w-6xl mx-auto py-8 px-4 flex flex-col gap-8">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-4">
        <div class="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <UIcon name="i-lucide-shield-check" class="size-6 text-primary" />
        </div>
        <div>
          <h1 class="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p class="text-sm text-dimmed">Platform management & analytics</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div
          v-if="user"
          class="flex items-center gap-3 px-4 py-2 rounded-xl bg-elevated border border-default"
        >
          <div class="flex flex-col text-right">
            <span class="text-sm font-medium">{{ user.name || 'Admin' }}</span>
            <span class="text-xs text-dimmed">{{ user.email }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="size-2 rounded-full" :class="isAdmin ? 'bg-success' : 'bg-warning'" />
            <span class="text-xs font-medium" :class="isAdmin ? 'text-success' : 'text-warning'">
              {{ isAdmin ? 'Admin' : 'User' }}
            </span>
          </div>
        </div>
        <UButton color="neutral" variant="outline" to="/" icon="i-lucide-arrow-left" size="sm">
          Back to site
        </UButton>
        <UButton
          color="error"
          variant="soft"
          icon="i-lucide-log-out"
          size="sm"
          @click="handleLogout"
        >
          Sign Out
        </UButton>
      </div>
    </div>

    <!-- Analytics Section -->
    <section>
      <div class="flex items-center gap-2 mb-4">
        <UIcon name="i-lucide-activity" class="size-5 text-primary" />
        <h2 class="text-lg font-semibold">Analytics & Insights</h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NuxtLink
          v-for="item in analytics"
          :key="item.to"
          :to="item.to"
          class="group relative overflow-hidden rounded-2xl border border-default bg-elevated p-6 transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
        >
          <div class="flex items-start justify-between mb-4">
            <div
              class="size-10 rounded-xl bg-default flex items-center justify-center group-hover:scale-110 transition-transform"
            >
              <UIcon :name="item.icon" class="size-5" :class="item.color" />
            </div>
            <UIcon
              name="i-lucide-arrow-up-right"
              class="size-4 text-dimmed opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
          <h3 class="font-semibold mb-1">{{ item.label }}</h3>
          <p class="text-sm text-dimmed">{{ item.desc }}</p>
        </NuxtLink>
      </div>
    </section>

    <!-- System Status -->
    <section>
      <div class="flex items-center gap-2 mb-4">
        <UIcon name="i-lucide-server" class="size-5 text-primary" />
        <h2 class="text-lg font-semibold">System Status</h2>
      </div>
      <UCard>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div class="flex items-center gap-3">
            <span class="size-2.5 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            <div>
              <p class="text-sm font-medium">Authentication</p>
              <p class="text-xs text-dimmed">{{ loggedIn ? 'Connected' : 'Disconnected' }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="size-2.5 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            <div>
              <p class="text-sm font-medium">Search Console</p>
              <p class="text-xs text-dimmed">Connected</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="size-2.5 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            <div>
              <p class="text-sm font-medium">Analytics</p>
              <p class="text-xs text-dimmed">Connected</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="size-2.5 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            <div>
              <p class="text-sm font-medium">PostHog</p>
              <p class="text-xs text-dimmed">Connected</p>
            </div>
          </div>
        </div>
      </UCard>
    </section>
  </div>
</template>
