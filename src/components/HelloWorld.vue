<template>
  <div class="hello-world">
    <p class="version">Version: {{ version }}</p>
    <p class="update-info">Auto-update enabled via GitHub Releases</p>
    <div v-if="updateStatus" class="update-status" :class="updateStatus.type">
      {{ updateStatus.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const version = ref('1.0.0');
const updateStatus = ref(null);

onMounted(() => {
  // Try to read version from package.json exposed via Electron or fallback
  if (window.__APP_VERSION__) {
    version.value = window.__APP_VERSION__;
  }

  if (window.api) {
    window.api.onUpdateAvailable((info) => {
      updateStatus.value = {
        type: 'info',
        message: `Update available: v${info.version}. Check the dialog to download.`,
      };
    });

    window.api.onUpdateDownloaded((info) => {
      updateStatus.value = {
        type: 'success',
        message: `Update v${info.version} downloaded. Restart when ready.`,
      };
    });
  }
});
</script>

<style scoped>
.hello-world {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(66, 184, 131, 0.3);
  min-width: 400px;
}

.version {
  font-size: 1.1rem;
  color: #42b883;
  font-weight: 600;
}

.update-info {
  color: #a0a0c0;
  font-size: 0.95rem;
}

.update-status {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  text-align: center;
}

.update-status.info {
  background: rgba(66, 153, 225, 0.2);
  border: 1px solid rgba(66, 153, 225, 0.5);
  color: #90cdf4;
}

.update-status.success {
  background: rgba(72, 187, 120, 0.2);
  border: 1px solid rgba(72, 187, 120, 0.5);
  color: #9ae6b4;
}
</style>
