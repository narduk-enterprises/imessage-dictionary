<script setup lang="ts">
definePageMeta({ title: 'Google Analytics', middleware: 'auth' })

interface GAMetricValue {
  value: string
}
interface GADimensionValue {
  value: string
}
interface GARow {
  metricValues?: GAMetricValue[]
  dimensionValues?: GADimensionValue[]
}
interface GAOverview {
  totals: GAMetricValue[]
  rows: GARow[]
}

const { refresh: refreshAuth } = useAuth()
await refreshAuth()

const { data: analyticsData, status } = await useFetch<GAOverview>('/api/admin/ga/overview')

const stats = computed(() => {
  if (!analyticsData.value) return []
  const totals = analyticsData.value.totals
  return [
    {
      label: 'Active Users',
      value: totals[0]?.value || '0',
      icon: 'i-lucide-users',
      color: 'text-blue-500',
    },
    {
      label: 'Sessions',
      value: totals[1]?.value || '0',
      icon: 'i-lucide-zap',
      color: 'text-amber-500',
    },
    {
      label: 'Page Views',
      value: totals[2]?.value || '0',
      icon: 'i-lucide-file-text',
      color: 'text-emerald-500',
    },
    {
      label: 'Bounce Rate',
      value: (Number(totals[3]?.value || 0) * 100).toFixed(1) + '%',
      icon: 'i-lucide-percent',
      color: 'text-rose-500',
    },
    {
      label: 'Avg Session',
      value: Math.round(Number(totals[4]?.value || 0)) + 's',
      icon: 'i-lucide-clock',
      color: 'text-violet-500',
    },
  ]
})

const maxBarValue = computed(() => {
  const rows = analyticsData.value?.rows || []
  return Math.max(...rows.map((r: GARow) => Number(r.metricValues?.[0]?.value) || 1), 1)
})
</script>

<template>
  <div class="max-w-6xl mx-auto py-8 px-4 flex flex-col gap-8">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <UButton variant="ghost" color="neutral" to="/admin" icon="i-lucide-arrow-left" size="sm" />
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Google Analytics</h1>
        <p class="text-sm text-dimmed">Visitor behavior · Last 30 days</p>
      </div>
    </div>

    <div v-if="status === 'pending'" class="h-96 flex items-center justify-center">
      <UIcon name="i-lucide-loader-2" class="size-10 animate-spin text-dimmed" />
    </div>

    <div
      v-else-if="!analyticsData"
      class="h-96 flex flex-col items-center justify-center text-dimmed"
    >
      <UIcon name="i-lucide-bar-chart-3" class="size-16 mb-4 opacity-20" />
      <p>No analytics data available</p>
      <p class="text-xs mt-1">Ensure the GA4 property is configured</p>
    </div>

    <template v-else>
      <!-- Stat Cards -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <UCard v-for="stat in stats" :key="stat.label">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-dimmed font-medium uppercase tracking-wider">{{
              stat.label
            }}</span>
            <UIcon :name="stat.icon" class="size-4" :class="stat.color" />
          </div>
          <span class="text-2xl font-bold tabular-nums">{{
            Number(stat.value).toLocaleString ? Number(stat.value).toLocaleString() : stat.value
          }}</span>
        </UCard>
      </div>

      <!-- Traffic Trend -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-trending-up" class="size-5 text-primary" />
            <span class="font-semibold">Daily Active Users</span>
          </div>
        </template>

        <div v-if="analyticsData.rows?.length" class="h-48 flex items-end gap-[2px] px-2">
          <div
            v-for="(row, idx) in analyticsData.rows"
            :key="idx"
            class="flex-1 bg-primary/25 hover:bg-primary/50 transition-all duration-150 rounded-t cursor-default relative group"
            :style="{
              height: `${Math.max((Number(row.metricValues?.[0]?.value) / maxBarValue) * 100, Number(row.metricValues?.[0]?.value) > 0 ? 2 : 0)}%`,
            }"
          >
            <div
              class="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverted text-inverted text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10"
            >
              {{ row.dimensionValues?.[0]?.value }}: {{ row.metricValues?.[0]?.value }}
            </div>
          </div>
        </div>
        <div v-else class="h-48 flex items-center justify-center text-dimmed italic">
          No daily data available
        </div>
      </UCard>
    </template>
  </div>
</template>
