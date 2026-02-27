<script setup lang="ts">
const toast = useToast()

const isAuthenticated = ref(false)
const passwordInput = ref('')

const form = reactive({
  term: '',
  pos: '',
  gloss: '',
  example: '',
  source: 'Custom Entry',
  license: 'CC BY-SA 4.0',
})

function handleLogin() {
  // Client-side auth check is just UX — the real protection is server-side
  if (passwordInput.value) {
    isAuthenticated.value = true
    sessionStorage.setItem('admin-authenticated', 'true')
    toast.add({ title: 'Authentication successful', color: 'success' })
  }
  else {
    toast.add({ title: 'Please enter the admin token', color: 'error' })
  }
}

async function handleSubmit() {
  if (!form.term.trim() || !form.gloss.trim()) {
    toast.add({ title: 'Term and definition are required', color: 'error' })
    return
  }

  try {
    // eslint-disable-next-line atx/no-fetch-in-component
    await $fetch('/api/admin/entries', {
      method: 'POST',
      headers: { Authorization: `Bearer ${passwordInput.value}` },
      body: {
        term: form.term,
        pos: form.pos || undefined,
        gloss: form.gloss,
        example: form.example || undefined,
        source: form.source,
        license: form.license,
      },
    })
    toast.add({ title: 'Entry saved successfully', color: 'success' })
    form.term = ''
    form.pos = ''
    form.gloss = ''
    form.example = ''
  }
  catch (err: any) {
    toast.add({ title: err?.data?.message || 'Failed to save entry', color: 'error' })
  }
}

onMounted(() => {
  if (sessionStorage.getItem('admin-authenticated') === 'true') {
    isAuthenticated.value = true
  }
})

useSeoMeta({
  title: 'Admin — iMessage Dictionary',
  robots: 'noindex, nofollow',
})
</script>

<template>
  <div class="min-h-screen">
    <div class="max-w-4xl mx-auto px-6 py-12">
      <UButton
        variant="ghost"
        icon="i-lucide-arrow-left"
        to="/"
        class="mb-8"
      >
        Back to Home
      </UButton>

      <!-- Login Form -->
      <template v-if="!isAuthenticated">
        <UCard class="max-w-md mx-auto">
          <h1 class="font-serif text-3xl font-bold text-primary-500 mb-6">
            Admin Access
          </h1>
          <UForm :state="{ passwordInput }" class="space-y-4" @submit="handleLogin">
            <UFormField label="Admin Token">
              <UInput
                v-model="passwordInput"
                type="password"
                placeholder="Enter admin token"
              />
            </UFormField>
            <UButton type="submit" block>
              Login
            </UButton>
          </UForm>
        </UCard>
      </template>

      <!-- Admin Panel -->
      <template v-else>
        <div class="mb-8">
          <h1 class="font-serif text-4xl font-bold text-primary-500 mb-2">
            Dictionary Admin
          </h1>
          <p class="text-lg text-muted">
            Add or update dictionary entries
          </p>
        </div>

        <UCard class="mb-8">
          <template #header>
            <div class="flex items-center gap-2 font-semibold">
              <UIcon name="i-lucide-plus" class="size-5" />
              Add / Update Entry
            </div>
          </template>

          <UForm :state="form" class="space-y-6" @submit="handleSubmit">
            <div class="grid md:grid-cols-2 gap-6">
              <UFormField label="Term *">
                <UInput
                  v-model="form.term"
                  placeholder="e.g., serendipity"
                  required
                  class="font-serif text-lg"
                />
              </UFormField>
              <UFormField label="Part of Speech">
                <UInput
                  v-model="form.pos"
                  placeholder="e.g., noun, verb, adjective"
                />
              </UFormField>
            </div>

            <UFormField label="Definition *">
              <UTextarea
                v-model="form.gloss"
                placeholder="Enter the definition..."
                required
                :rows="3"
                class="font-serif text-lg"
              />
            </UFormField>

            <UFormField label="Example Sentence">
              <UTextarea
                v-model="form.example"
                placeholder="Enter an example sentence..."
                :rows="2"
                class="font-serif"
              />
            </UFormField>

            <div class="grid md:grid-cols-2 gap-6">
              <UFormField label="Source *">
                <UInput
                  v-model="form.source"
                  placeholder="e.g., Wiktionary"
                  required
                />
              </UFormField>
              <UFormField label="License *">
                <UInput
                  v-model="form.license"
                  placeholder="e.g., CC BY-SA 4.0"
                  required
                />
              </UFormField>
            </div>

            <UButton type="submit" size="lg" icon="i-lucide-check" block>
              Save Entry
            </UButton>
          </UForm>
        </UCard>
      </template>
    </div>
  </div>
</template>
