// PWA Install Utility
let deferredPrompt: any = null;

// Listen for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('[PWA] Install prompt available');
});

export const canInstallPWA = (): boolean => {
  return deferredPrompt !== null;
};

export const promptPWAInstall = async (): Promise<boolean> => {
  if (!deferredPrompt) {
    console.log('[PWA] No install prompt available');
    // Fallback for iOS - show manual instructions
    if (isIOS()) {
      alert('Untuk menginstall:\n1. Tap tombol Share di Safari\n2. Pilih "Add to Home Screen"');
    }
    return false;
  }

  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] User choice:', outcome);
    deferredPrompt = null;
    return outcome === 'accepted';
  } catch (err) {
    console.error('[PWA] Install error:', err);
    return false;
  }
};

export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

export const isInStandaloneMode = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
};
