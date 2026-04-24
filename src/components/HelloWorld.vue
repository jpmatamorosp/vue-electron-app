<template>
  <div class="hello-world">
    <p class="version">Versión: {{ version }}</p>

    <button class="check-update-btn" :disabled="isChecking" @click="checkForUpdates">
      <span v-if="isChecking" class="spinner"></span>
      {{ isChecking ? 'Verificando...' : 'Buscar actualizaciones' }}
    </button>

    <div v-if="downloadProgress" class="progress-container">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: downloadProgress.percent + '%' }"></div>
      </div>
      <p class="progress-text">Descargando: {{ Math.round(downloadProgress.percent) }}%</p>
    </div>

    <div v-if="updateStatus" class="update-status" :class="updateStatus.type">
      {{ updateStatus.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const version = ref('...');
const updateStatus = ref(null);
const isChecking = ref(false);
const downloadProgress = ref(null);

async function checkForUpdates() {
  if (!window.api) {
    updateStatus.value = {
      type: 'warning',
      message: 'Verificación no disponible fuera de Electron.',
    };
    return;
  }
  isChecking.value = true;
  updateStatus.value = null;
  downloadProgress.value = null;
  try {
    await window.api.checkForUpdates();
  } catch {
    isChecking.value = false;
  }
}

onMounted(async () => {
  if (window.api) {
    try {
      version.value = await window.api.getAppVersion();
    } catch {
      version.value = '1.0.4';
    }

    window.api.onUpdateChecking(() => {
      isChecking.value = true;
      updateStatus.value = { type: 'info', message: 'Buscando actualizaciones...' };
    });

    window.api.onUpdateAvailable((info) => {
      isChecking.value = false;
      updateStatus.value = {
        type: 'info',
        message: `Nueva versión disponible: v${info.version}`,
      };
    });

    window.api.onUpdateNotAvailable(() => {
      isChecking.value = false;
      updateStatus.value = {
        type: 'success',
        message: 'Estás usando la última versión.',
      };
      setTimeout(() => { updateStatus.value = null; }, 5000);
    });

    window.api.onUpdateDownloadProgress((progress) => {
      downloadProgress.value = progress;
    });

    window.api.onUpdateDownloaded((info) => {
      isChecking.value = false;
      downloadProgress.value = null;
      updateStatus.value = {
        type: 'success',
        message: `v${info.version} descargada. Reinicia para aplicar.`,
      };
    });

    window.api.onUpdateError((err) => {
      isChecking.value = false;
      downloadProgress.value = null;
      updateStatus.value = {
        type: 'error',
        message: `Error: ${err.message}`,
      };
    });
  } else {
    version.value = '1.0.4';
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

.check-update-btn {
  padding: 0.6rem 1.4rem;
  background: linear-gradient(135deg, #42b883, #3aa876);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.check-update-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #3aa876, #2d8a5e);
  transform: translateY(-1px);
}

.check-update-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.progress-container {
  width: 100%;
  max-width: 320px;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #42b883, #3aa876);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.8rem;
  color: #a0a0c0;
  text-align: center;
  margin-top: 0.3rem;
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

.update-status.warning {
  background: rgba(236, 201, 75, 0.2);
  border: 1px solid rgba(236, 201, 75, 0.5);
  color: #f6e05e;
}

.update-status.error {
  background: rgba(245, 101, 101, 0.2);
  border: 1px solid rgba(245, 101, 101, 0.5);
  color: #feb2b2;
}
</style>
