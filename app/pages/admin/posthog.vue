<script setup lang="ts">
definePageMeta({ title: 'PostHog Analytics', middleware: 'auth' })

interface PHAction {
  math?: string
}
interface PHSeries {
  action?: PHAction
  count?: number
  data?: number[]
  labels?: string[]
}
interface PHInsights {
  results: PHSeries[]
  resolved_date_range?: { date_from: string; date_to: string }
}
interface PHPageRow {
  page: string
  pageviews: number
  uniqueVisitors: number
}
interface PHReferrerRow {
  referrer: string
  visits: number
  uniqueVisitors: number
}
interface PHDeviceRow {
  device: string
  pageviews: number
  uniqueVisitors: number
}
interface PHEntryExitRow {
  page: string
  count: number
}
interface PHRecording {
  id: string
  startTime: string
  endTime: string
  duration: number
  activeSeconds: number
  clickCount: number
  keypressCount: number
  startUrl: string
  personId: string
}

const { refresh: refreshAuth } = useAuth()
await refreshAuth()

const config = useRuntimeConfig()
const posthogProjectId = config.public.posthogProjectId || ''

// Date range selector
const dateRange = ref('30')
const dateRangeOptions = [
  { label: '7 days', value: '7' },
  { label: '14 days', value: '14' },
  { label: '30 days', value: '30' },
  { label: '60 days', value: '60' },
  { label: '90 days', value: '90' },
]

const insightParams = computed(() => ({ startDate: `-${dateRange.value}d` }))
const dayParams = computed(() => ({ days: dateRange.value }))

// Trends data (pageviews + DAU over time)
const { data: posthogData, status } = await useFetch<PHInsights>('/api/admin/posthog/insights', {
  query: insightParams,
  watch: [insightParams],
})

// Top pages
const { data: pagesData } = await useFetch<{ rows: PHPageRow[] }>('/api/admin/posthog/pages', {
  query: dayParams,
  watch: [dayParams],
})

// Top referrers
const { data: referrersData } = await useFetch<{ rows: PHReferrerRow[] }>(
  '/api/admin/posthog/referrers',
  {
    query: dayParams,
    watch: [dayParams],
  },
)

// Device breakdown
const { data: devicesData } = await useFetch<{ rows: PHDeviceRow[] }>(
  '/api/admin/posthog/devices',
  {
    query: dayParams,
    watch: [dayParams],
  },
)

// Entry/exit pages
const { data: entryExitData } = await useFetch<{
  entryPages: PHEntryExitRow[]
  exitPages: PHEntryExitRow[]
}>('/api/admin/posthog/entry-exit', {
  query: dayParams,
  watch: [dayParams],
})

// Recent recordings
const { data: recordingsData } = await useFetch<{ recordings: PHRecording[] }>(
  '/api/admin/posthog/recordings',
  {
    query: { limit: '10' },
  },
)

const results = computed(() => posthogData.value?.results || [])
const pages = computed(() => pagesData.value?.rows || [])
const referrers = computed(() => referrersData.value?.rows || [])
const devices = computed(() => devicesData.value?.rows || [])
const entryPages = computed(() => entryExitData.value?.entryPages || [])
const exitPages = computed(() => entryExitData.value?.exitPages || [])
const recordings = computed(() => recordingsData.value?.recordings || [])

// Split results into Pageviews (total) and Unique Visitors (dau)
const pageviewSeries = computed(() =>
  results.value.find((r: PHSeries) => r.action?.math === 'total'),
)
const dauSeries = computed(() => results.value.find((r: PHSeries) => r.action?.math === 'dau'))

// Summary stats
const totalPageviews = computed(() => pageviewSeries.value?.count || 0)
const totalUniqueVisitors = computed(() => dauSeries.value?.count || 0)
const avgPerDay = computed(() => {
  const data = pageviewSeries.value?.data || []
  const nonZero = data.filter((v: number) => v > 0)
  return nonZero.length > 0
    ? Math.round(data.reduce((a: number, b: number) => a + b, 0) / nonZero.length)
    : 0
})
const pagesPerVisitor = computed(() => {
  if (!totalPageviews.value || !totalUniqueVisitors.value) return '—'
  return (totalPageviews.value / totalUniqueVisitors.value).toFixed(1)
})

// Device stats
const totalDevicePageviews = computed(
  () => devices.value.reduce((sum: number, d: PHDeviceRow) => sum + d.pageviews, 0) || 1,
)
const deviceColors: Record<string, string> = {
  Desktop: 'bg-blue-500',
  Mobile: 'bg-emerald-500',
  Tablet: 'bg-amber-500',
}

const formatLabel = (label: string) => {
  if (!label) return ''
  const parts = (label || '').split('-')
  return parts.length === 3 ? `${parts[1]}/${parseInt(parts[2] || '0')}` : label
}

const dateRangeText = computed(() => {
  const range = posthogData.value?.resolved_date_range
  if (!range) return ''
  const from = new Date(range.date_from).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  const to = new Date(range.date_to).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${from} – ${to}`
})

const maxPageviews = computed(() =>
  pages.value.length ? Math.max(...pages.value.map((p: PHPageRow) => p.pageviews)) : 1,
)
const maxRefVisits = computed(() =>
  referrers.value.length ? Math.max(...referrers.value.map((r: PHReferrerRow) => r.visits)) : 1,
)
const maxEntries = computed(() =>
  entryPages.value.length ? Math.max(...entryPages.value.map((p: PHEntryExitRow) => p.count)) : 1,
)
const maxExits = computed(() =>
  exitPages.value.length ? Math.max(...exitPages.value.map((p: PHEntryExitRow) => p.count)) : 1,
)

const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return `${mins}m ${secs}s`
}

const formatRecordingTime = (iso: string) => {
  const d = new Date(iso)
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  )
}

const posthogRecordingUrl = (id: string) =>
  `https://us.posthog.com/project/${posthogProjectId}/replay/${id}`
</script>

<template>
  <div class="max-w-6xl mx-auto py-8 px-4 flex flex-col gap-8">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-3">
        <UButton variant="ghost" color="neutral" to="/admin" icon="i-lucide-arrow-left" size="sm" />
        <div>
          <h1 class="text-2xl font-bold tracking-tight">PostHog Analytics</h1>
          <p class="text-sm text-dimmed">
            Product analytics
            <span v-if="dateRangeText" class="ml-1 opacity-60">· {{ dateRangeText }}</span>
          </p>
        </div>
      </div>

      <!-- Date range selector -->
      <div class="flex gap-1 bg-elevated border border-default rounded-xl p-1">
        <button
          v-for="opt in dateRangeOptions"
          :key="opt.value"
          class="px-3 py-1.5 text-sm font-medium rounded-lg transition-all"
          :class="
            dateRange === opt.value
              ? 'bg-primary text-white shadow-sm'
              : 'text-dimmed hover:text-default hover:bg-default'
          "
          @click="dateRange = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- Loading / Empty states -->
    <div v-if="status === 'pending'" class="h-96 flex items-center justify-center">
      <UIcon name="i-lucide-loader-2" class="size-10 animate-spin text-dimmed" />
    </div>

    <div
      v-else-if="results.length === 0"
      class="h-96 flex flex-col items-center justify-center text-dimmed"
    >
      <UIcon name="i-lucide-zap-off" class="size-16 mb-4 opacity-20" />
      <p>No PostHog data found</p>
      <p class="text-xs mt-1">Ensure the PostHog API key is configured</p>
    </div>

    <template v-else>
      <!-- Summary Stat Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <UCard>
          <div class="flex items-center gap-2 mb-2">
            <UIcon name="i-lucide-eye" class="size-4 text-primary" />
            <span class="text-xs text-dimmed uppercase tracking-wider font-medium">Pageviews</span>
          </div>
          <p class="text-3xl font-bold tabular-nums">{{ totalPageviews.toLocaleString() }}</p>
        </UCard>
        <UCard>
          <div class="flex items-center gap-2 mb-2">
            <UIcon name="i-lucide-users" class="size-4 text-emerald-500" />
            <span class="text-xs text-dimmed uppercase tracking-wider font-medium"
              >Unique Visitors</span
            >
          </div>
          <p class="text-3xl font-bold tabular-nums">{{ totalUniqueVisitors.toLocaleString() }}</p>
        </UCard>
        <UCard>
          <div class="flex items-center gap-2 mb-2">
            <UIcon name="i-lucide-trending-up" class="size-4 text-amber-500" />
            <span class="text-xs text-dimmed uppercase tracking-wider font-medium"
              >Avg / Active Day</span
            >
          </div>
          <p class="text-3xl font-bold tabular-nums">{{ avgPerDay.toLocaleString() }}</p>
        </UCard>
        <UCard>
          <div class="flex items-center gap-2 mb-2">
            <UIcon name="i-lucide-ratio" class="size-4 text-violet-500" />
            <span class="text-xs text-dimmed uppercase tracking-wider font-medium"
              >Pages / Visitor</span
            >
          </div>
          <p class="text-3xl font-bold tabular-nums">{{ pagesPerVisitor }}</p>
        </UCard>
      </div>

      <!-- Pageview Trend Chart -->
      <UCard v-if="pageviewSeries">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-primary" />
                <span class="font-semibold">Pageviews</span>
              </div>
              <div v-if="dauSeries" class="flex items-center gap-2 ml-4">
                <div class="w-3 h-3 rounded-full bg-emerald-500" />
                <span class="text-sm text-dimmed">Unique Visitors</span>
              </div>
            </div>
            <span class="text-sm text-dimmed tabular-nums"
              >{{ totalPageviews.toLocaleString() }} total</span
            >
          </div>
        </template>

        <div class="h-44 flex items-end gap-[2px] relative">
          <div
            v-for="(val, idx) in pageviewSeries.data || []"
            :key="idx"
            class="flex-1 relative group"
            :style="{ height: '100%' }"
          >
            <!-- Pageview bar -->
            <div
              class="absolute bottom-0 left-0 right-0 bg-primary/25 hover:bg-primary/50 transition-all duration-150 rounded-t"
              :style="{
                height: `${Math.max((val / Math.max(...(pageviewSeries.data || []), 1)) * 100, val > 0 ? 2 : 0)}%`,
              }"
            />
            <!-- DAU overlay bar -->
            <div
              v-if="dauSeries?.data?.[idx]"
              class="absolute bottom-0 left-[15%] right-[15%] bg-emerald-500/40 rounded-t pointer-events-none"
              :style="{
                height: `${Math.max((dauSeries.data[idx] / Math.max(...(pageviewSeries.data || []), 1)) * 100, dauSeries.data[idx] > 0 ? 2 : 0)}%`,
              }"
            />
            <!-- Tooltip -->
            <div
              class="absolute -top-10 left-1/2 -translate-x-1/2 bg-inverted text-inverted text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10"
            >
              {{ formatLabel(pageviewSeries.labels?.[idx] || '') }}: {{ val }}
              <span v-if="dauSeries?.data?.[idx]" class="text-emerald-300">
                · {{ dauSeries.data[idx] }} uv</span
              >
            </div>
          </div>
        </div>
        <div class="flex justify-between text-xs text-dimmed px-1 mt-2">
          <span>{{ formatLabel(pageviewSeries.labels?.[0] || '') }}</span>
          <span>{{
            formatLabel(
              pageviewSeries.labels?.[Math.floor((pageviewSeries.labels?.length || 0) / 2)] || '',
            )
          }}</span>
          <span>{{
            formatLabel(pageviewSeries.labels?.[(pageviewSeries.labels?.length || 1) - 1] || '')
          }}</span>
        </div>
      </UCard>

      <!-- Device Breakdown -->
      <UCard v-if="devices.length > 0">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-monitor-smartphone" class="size-5 text-primary" />
            <span class="font-semibold">Device Breakdown</span>
          </div>
        </template>

        <div class="flex flex-col gap-4">
          <!-- Device distribution bar -->
          <div class="h-8 flex rounded-xl overflow-hidden">
            <div
              v-for="device in devices"
              :key="device.device"
              class="transition-all duration-300 relative group"
              :class="deviceColors[device.device] || 'bg-neutral-400'"
              :style="{ width: `${(device.pageviews / totalDevicePageviews) * 100}%` }"
            >
              <div
                v-if="(device.pageviews / totalDevicePageviews) * 100 > 8"
                class="absolute inset-0 flex items-center justify-center text-xs font-medium text-white"
              >
                {{ Math.round((device.pageviews / totalDevicePageviews) * 100) }}%
              </div>
            </div>
          </div>

          <!-- Device details -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              v-for="device in devices"
              :key="device.device"
              class="flex items-center gap-3 p-3 rounded-xl border border-default"
            >
              <div
                class="size-3 rounded-full shrink-0"
                :class="deviceColors[device.device] || 'bg-neutral-400'"
              />
              <div class="flex-1">
                <p class="text-sm font-medium">{{ device.device || 'Unknown' }}</p>
                <p class="text-xs text-dimmed">
                  {{ device.uniqueVisitors.toLocaleString() }} unique visitors
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold tabular-nums">
                  {{ device.pageviews.toLocaleString() }}
                </p>
                <p class="text-xs text-dimmed tabular-nums">
                  {{ Math.round((device.pageviews / totalDevicePageviews) * 100) }}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Top Pages + Top Referrers side-by-side -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Top Pages -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-file-text" class="size-4 text-primary" />
              <span class="font-semibold">Top Pages</span>
            </div>
          </template>
          <div v-if="pages.length === 0" class="text-sm text-dimmed italic py-4 text-center">
            No page data available
          </div>
          <div v-else class="flex flex-col gap-2.5">
            <div v-for="page in pages.slice(0, 10)" :key="page.page">
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="truncate max-w-[240px] font-medium" :title="page.page">{{
                  page.page || '/'
                }}</span>
                <div class="flex items-center gap-3 text-dimmed shrink-0">
                  <span class="tabular-nums">{{ page.pageviews.toLocaleString() }}</span>
                  <span class="text-xs w-12 text-right tabular-nums">
                    {{ page.uniqueVisitors }} <span class="opacity-50">uv</span>
                  </span>
                </div>
              </div>
              <div class="h-1.5 rounded-full bg-default overflow-hidden">
                <div
                  class="h-full rounded-full bg-primary/50 transition-all duration-300"
                  :style="{ width: `${(page.pageviews / maxPageviews) * 100}%` }"
                />
              </div>
            </div>
          </div>
        </UCard>

        <!-- Top Referrers -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-link" class="size-4 text-emerald-500" />
              <span class="font-semibold">Top Referrers</span>
            </div>
          </template>
          <div v-if="referrers.length === 0" class="text-sm text-dimmed italic py-4 text-center">
            No referrer data available
          </div>
          <div v-else class="flex flex-col gap-2.5">
            <div v-for="ref in referrers.slice(0, 10)" :key="ref.referrer">
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="truncate max-w-[240px] font-medium" :title="ref.referrer">{{
                  ref.referrer
                }}</span>
                <div class="flex items-center gap-3 text-dimmed shrink-0">
                  <span class="tabular-nums">{{ ref.visits.toLocaleString() }}</span>
                  <span class="text-xs w-12 text-right tabular-nums">
                    {{ ref.uniqueVisitors }} <span class="opacity-50">uv</span>
                  </span>
                </div>
              </div>
              <div class="h-1.5 rounded-full bg-default overflow-hidden">
                <div
                  class="h-full rounded-full bg-emerald-500/50 transition-all duration-300"
                  :style="{ width: `${(ref.visits / maxRefVisits) * 100}%` }"
                />
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Entry & Exit Pages side-by-side -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Entry Pages -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-log-in" class="size-4 text-blue-500" />
              <span class="font-semibold">Entry Pages</span>
            </div>
          </template>
          <div v-if="entryPages.length === 0" class="text-sm text-dimmed italic py-4 text-center">
            No entry page data
          </div>
          <div v-else class="flex flex-col gap-2.5">
            <div v-for="page in entryPages.slice(0, 8)" :key="page.page">
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="truncate max-w-[240px] font-medium" :title="page.page">{{
                  page.page || '/'
                }}</span>
                <span class="text-dimmed tabular-nums shrink-0">{{
                  page.count.toLocaleString()
                }}</span>
              </div>
              <div class="h-1.5 rounded-full bg-default overflow-hidden">
                <div
                  class="h-full rounded-full bg-blue-500/50 transition-all duration-300"
                  :style="{ width: `${(page.count / maxEntries) * 100}%` }"
                />
              </div>
            </div>
          </div>
        </UCard>

        <!-- Exit Pages -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-log-out" class="size-4 text-rose-500" />
              <span class="font-semibold">Exit Pages</span>
            </div>
          </template>
          <div v-if="exitPages.length === 0" class="text-sm text-dimmed italic py-4 text-center">
            No exit page data
          </div>
          <div v-else class="flex flex-col gap-2.5">
            <div v-for="page in exitPages.slice(0, 8)" :key="page.page">
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="truncate max-w-[240px] font-medium" :title="page.page">{{
                  page.page || '/'
                }}</span>
                <span class="text-dimmed tabular-nums shrink-0">{{
                  page.count.toLocaleString()
                }}</span>
              </div>
              <div class="h-1.5 rounded-full bg-default overflow-hidden">
                <div
                  class="h-full rounded-full bg-rose-500/50 transition-all duration-300"
                  :style="{ width: `${(page.count / maxExits) * 100}%` }"
                />
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Recent Recordings -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-play-circle" class="size-4 text-rose-500" />
              <span class="font-semibold">Recent Recordings</span>
            </div>
            <a
              v-if="posthogProjectId"
              :href="`https://us.posthog.com/project/${posthogProjectId}/replay`"
              target="_blank"
              class="text-xs text-primary hover:underline"
            >
              View all →
            </a>
          </div>
        </template>

        <div v-if="recordings.length === 0" class="text-sm text-dimmed italic py-4 text-center">
          No recordings available
        </div>
        <div v-else class="flex flex-col divide-y divide-default">
          <a
            v-for="rec in recordings"
            :key="rec.id"
            :href="posthogRecordingUrl(rec.id)"
            target="_blank"
            class="flex items-center justify-between py-3 hover:bg-elevated -mx-2 px-2 rounded-lg transition-colors group first:pt-0 last:pb-0"
          >
            <div class="flex items-center gap-3 min-w-0">
              <UIcon
                name="i-lucide-play"
                class="size-4 text-rose-400 shrink-0 group-hover:text-rose-500 transition-colors"
              />
              <div class="min-w-0">
                <p class="text-sm font-medium truncate max-w-sm">
                  {{ rec.startUrl?.replace(/^https?:\/\//, '') || 'Unknown page' }}
                </p>
                <p class="text-xs text-dimmed">
                  {{ formatRecordingTime(rec.startTime) }} · {{ rec.personId }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-4 text-xs text-dimmed shrink-0">
              <span class="flex items-center gap-1" :title="`${rec.clickCount} clicks`">
                <UIcon name="i-lucide-mouse-pointer-click" class="size-3" />
                {{ rec.clickCount }}
              </span>
              <span class="font-medium text-default tabular-nums">{{
                formatDuration(rec.duration)
              }}</span>
            </div>
          </a>
        </div>
      </UCard>
    </template>
  </div>
</template>
