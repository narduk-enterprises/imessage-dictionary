<!--
  OG Image Template — Dictionary Card (Takumi Renderer)
  Uses Inter for all text to avoid Crimson Pro font subsetting issues.
-->
<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  description?: string
  pos?: string
  siteName?: string
}>(), {
  title: 'Free Dictionary',
  description: 'Share beautiful word definitions in iMessage',
  pos: '',
  siteName: 'dictionary.nard.uk',
})
</script>

<template>
  <div
    tw="w-full h-full flex flex-col justify-start items-start relative overflow-hidden"
    :style="{
      padding: '60px 72px',
      backgroundColor: '#f5f0e8',
    }"
  >
    <!-- Word title row -->
    <div tw="flex flex-row items-center" :style="{ gap: '24px', marginBottom: '32px' }">
      <span
        tw="font-bold"
        :style="{
          fontSize: '80px',
          color: '#1a2744',
          lineHeight: '1',
          fontFamily: 'Inter, sans-serif',
          fontWeight: '700',
        }"
      >{{ title }}</span>

      <span
        v-if="pos"
        tw="flex items-center justify-center uppercase"
        :style="{
          padding: '8px 20px',
          borderRadius: '8px',
          backgroundColor: '#c49a6c',
          color: '#ffffff',
          fontSize: '20px',
          fontWeight: '600',
          letterSpacing: '0.1em',
          fontFamily: 'Inter, sans-serif',
        }"
      >{{ pos }}</span>
    </div>

    <!-- Definition text -->
    <span
      :style="{
        fontSize: '36px',
        fontWeight: '400',
        color: '#2d3748',
        lineHeight: '1.4',
        maxWidth: '1000px',
        fontFamily: 'Inter, sans-serif',
      }"
    >{{ description }}</span>

    <!-- Bottom: divider + site name -->
    <div
      tw="flex flex-col absolute"
      :style="{
        bottom: '48px',
        left: '72px',
        right: '72px',
        gap: '12px',
      }"
    >
      <div :style="{ width: '100%', height: '1px', backgroundColor: '#d4c9b8' }" />
      <span
        :style="{
          fontSize: '20px',
          fontWeight: '400',
          color: '#8a8078',
          fontFamily: 'Inter, sans-serif',
        }"
      >{{ siteName }}</span>
    </div>
  </div>
</template>
