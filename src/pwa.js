import { t } from './i18n.js';

let deferredPwaPrompt = null;

export function initPWA() {
  try {
    if (
      'serviceWorker' in navigator &&
      (window.location.protocol === 'https:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1')
    ) {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.warn('No se pudo registrar el Service Worker:', err);
      });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPwaPrompt = e;
      const box = document.getElementById('nativePwaInstallBox');
      if (box) box.classList.remove('hidden');
      const btnText = document.getElementById('pwaHeaderBtnText');
      if (btnText) btnText.textContent = t('header.pwaInstallShort');
    });
  } catch (e) {
    console.warn('Aviso inicializando PWA:', e);
  }
}

export async function triggerNativePwaInstall({ showToast, closeModal }) {
  if (!deferredPwaPrompt) {
    showToast(t('pwa.manualInstallToast'));
    return;
  }
  deferredPwaPrompt.prompt();
  const { outcome } = await deferredPwaPrompt.userChoice;
  if (outcome === 'accepted') {
    showToast(t('pwa.installedToast'));
    closeModal('pwaModal');
  }
  deferredPwaPrompt = null;
}
