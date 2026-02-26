<script setup lang="ts">
definePageMeta({ title: 'Search Console', middleware: 'auth' })

interface GSCSitemapContent {
  type: string
  submitted: number
  indexed: number
}
interface GSCSitemap {
  path: string
  lastSubmitted: string
  errors: number
  warnings: number
  contents: GSCSitemapContent[]
}
interface GSCRow {
  keys?: string[]
  clicks?: number
  impressions?: number
  ctr: number
  position: number
}
interface GSCPerformance {
  rows?: GSCRow[]
}

const { refresh: refreshAuth } = useAuth()
await refreshAuth()

const dimension = ref('query')

const { data: gscData, status } = await useFetch('/api/admin/gsc/performance', {
  query: computed(() => ({ dimension: dimension.value })),
  watch: [dimension],
})

const { data: sitemapData, status: sitemapStatus, refresh: refreshSitemaps } = await useFetch<{ sitemaps: GSCSitemap[] }>(
  '/api/admin/gsc/sitemaps',
)

const toast = useToast()
const submitting = ref(false)

async function submitSitemap() {
  submitting.value = true
  try {
    await $fetch('/api/admin/gsc/submit-sitemap', { method: 'POST' })
    toast.add({ title: 'Sitemap submitted to Google', color: 'success', icon: 'i-lucide-check-circle-2' })
    await refreshSitemaps()
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string }; message?: string }
    toast.add({
      title: 'Submission failed',
      description: err.data?.statusMessage || err.message || 'Unknown error',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    })
  } finally {
    submitting.value = false
  }
}

const sitemaps = computed(() => sitemapData.value?.sitemaps || [])

const totalSubmitted = computed(() =>
  sitemaps.value.reduce(
    (sum: number, s: GSCSitemap) =>
      sum +
      (s.contents?.reduce((cs: number, c: GSCSitemapContent) => cs + (c.submitted || 0), 0) || 0),
    0,
  ),
)

const totalIndexed = computed(() =>
  sitemaps.value.reduce(
    (sum: number, s: GSCSitemap) =>
      sum +
      (s.contents?.reduce((cs: number, c: GSCSitemapContent) => cs + (c.indexed || 0), 0) || 0),
    0,
  ),
)

const dimensionTabs = [
  { label: 'Queries', value: 'query' },
  { label: 'Pages', value: 'page' },
  { label: 'Devices', value: 'device' },
  { label: 'Countries', value: 'country' },
]

const formatCtr = (val: number) => (val * 100).toFixed(1) + '%'
const formatPos = (val: number) => val.toFixed(1)
const formatDate = (d: string) =>
  d
    ? new Date(d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—'
</script>

<template>
  <div class="max-w-6xl mx-auto py-8 px-4 flex flex-col gap-8">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-3">
        <UButton variant="ghost" color="neutral" to="/admin" icon="i-lucide-arrow-left" size="sm" />
        <div>
          <h1 class="text-2xl font-bold tracking-tight">Search Console</h1>
          <p class="text-sm text-dimmed">Organic search performance · Last 30 days</p>
        </div>
      </div>

      <div class="flex gap-1 bg-elevated border border-default rounded-xl p-1">
        <button
          v-for="tab in dimensionTabs"
          :key="tab.value"
          class="px-3 py-1.5 text-sm font-medium rounded-lg transition-all"
          :class="
            dimension === tab.value
              ? 'bg-primary text-white shadow-sm'
              : 'text-dimmed hover:text-default hover:bg-default'
          "
          @click="dimension = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Sitemap Statistics -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-file-text" class="size-5 text-primary" />
          <span class="font-semibold">Sitemaps</span>
          <div class="ml-auto">
            <UButton
              label="Submit Sitemap"
              icon="i-lucide-send"
              size="xs"
              :loading="submitting"
              @click="submitSitemap"
            />
          </div>
        </div>
      </template>

      <div v-if="sitemapStatus === 'pending'" class="flex items-center gap-2 text-dimmed">
        <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
        <span class="text-sm">Loading sitemaps…</span>
      </div>

      <div v-else-if="sitemaps.length === 0" class="text-dimmed text-sm italic">
        No sitemaps found
      </div>

      <template v-else>
        <div class="grid grid-cols-3 gap-4 mb-6">
          <div class="p-4 rounded-xl bg-default border border-default">
            <p class="text-xs text-dimmed uppercase tracking-wider font-medium">Sitemaps</p>
            <p class="text-2xl font-bold tabular-nums">{{ sitemaps.length }}</p>
          </div>
          <div class="p-4 rounded-xl bg-default border border-default">
            <p class="text-xs text-dimmed uppercase tracking-wider font-medium">URLs Submitted</p>
            <p class="text-2xl font-bold tabular-nums">{{ totalSubmitted.toLocaleString() }}</p>
          </div>
          <div class="p-4 rounded-xl bg-default border border-default">
            <p class="text-xs text-dimmed uppercase tracking-wider font-medium">URLs Indexed</p>
            <p class="text-2xl font-bold tabular-nums text-success">
              {{ totalIndexed.toLocaleString() }}
            </p>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <div
            v-for="sitemap in sitemaps"
            :key="sitemap.path"
            class="flex items-center justify-between p-3 rounded-xl border border-default"
          >
            <div class="flex items-center gap-3 min-w-0">
              <UIcon
                :name="sitemap.errors > 0 ? 'i-lucide-alert-circle' : 'i-lucide-check-circle-2'"
                :class="sitemap.errors > 0 ? 'text-error' : 'text-success'"
                class="size-5 shrink-0"
              />
              <div class="min-w-0">
                <p class="text-sm font-medium truncate">{{ sitemap.path }}</p>
                <p class="text-xs text-dimmed">
                  Last submitted {{ formatDate(sitemap.lastSubmitted) }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-4 text-sm shrink-0">
              <div v-for="content in sitemap.contents" :key="content.type" class="text-right">
                <span class="text-xs text-dimmed block">{{ content.type }}</span>
                <span class="font-medium tabular-nums">
                  {{ content.indexed }}<span class="text-dimmed">/{{ content.submitted }}</span>
                </span>
              </div>
              <UBadge v-if="sitemap.errors > 0" color="error" variant="subtle" size="xs">
                {{ sitemap.errors }} errors
              </UBadge>
              <UBadge v-if="sitemap.warnings > 0" color="warning" variant="subtle" size="xs">
                {{ sitemap.warnings }} warnings
              </UBadge>
            </div>
          </div>
        </div>
      </template>
    </UCard>

    <!-- Performance Table -->
    <UCard>
      <template #header>
        <span class="font-semibold">Performance Data</span>
      </template>

      <div v-if="status === 'pending'" class="h-64 flex items-center justify-center">
        <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-dimmed" />
      </div>

      <div
        v-else-if="!gscData || !(gscData as unknown as GSCPerformance).rows?.length"
        class="h-64 flex flex-col items-center justify-center text-dimmed"
      >
        <UIcon name="i-lucide-search-x" class="size-16 mb-4 opacity-20" />
        <p>No search performance data available</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="admin-table">
          <thead>
            <tr>
              <th>
                {{
                  dimension === 'query'
                    ? 'Query'
                    : dimension === 'page'
                      ? 'Page'
                      : dimension === 'device'
                        ? 'Device'
                        : 'Country'
                }}
              </th>
              <th class="text-right">Clicks</th>
              <th class="text-right">Impressions</th>
              <th class="text-right">CTR</th>
              <th class="text-right">Position</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in (gscData as unknown as GSCPerformance).rows" :key="idx">
              <td class="font-medium max-w-[300px] truncate">{{ row.keys?.[0] }}</td>
              <td class="text-right tabular-nums">{{ row.clicks?.toLocaleString() }}</td>
              <td class="text-right tabular-nums">{{ row.impressions?.toLocaleString() }}</td>
              <td class="text-right tabular-nums">{{ formatCtr(row.ctr) }}</td>
              <td class="text-right tabular-nums">{{ formatPos(row.position) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </div>
</template>

<style>
.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.admin-table th {
  text-align: left;
  padding: 0.625rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--ui-text-dimmed);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid var(--ui-border);
}
.admin-table td {
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid var(--ui-border);
  white-space: nowrap;
}
.admin-table tr:hover td {
  background: var(--ui-bg-elevated);
}
</style>
