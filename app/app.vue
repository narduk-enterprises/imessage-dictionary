<script setup lang="ts">
const route = useRoute()

/**
 * Site-wide SEO defaults are handled by @nuxtjs/seo via nuxt.config.ts `site` block.
 * The titleTemplate is automatically set to `%s %separator %siteName`.
 * Individual pages use the `useSeo()` composable to set their own title/description/OG.
 */
</script>

<template>
  <UApp>
    <div class="app-shell min-h-screen flex flex-col bg-[#f5f1e8]">
      <!-- Main -->
      <main class="flex-1">
        <NuxtPage />
      </main>

      <!-- Minimal footer -->
      <footer class="border-t border-[#d4c9b8] py-6">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p class="text-center text-sm text-[#8a8078]">
            iMessage Dictionary &middot; Nuxt UI 4 &middot; Cloudflare Workers &middot; {{ new Date().getFullYear() }}
          </p>
        </div>
      </footer>
    </div>
  </UApp>
</template>
