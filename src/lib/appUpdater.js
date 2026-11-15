import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

const VERSION_API =
  'https://duniatahu-api.christainmichael22.workers.dev/api/version';

export async function checkForUpdate() {
  try {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    const [appInfo, response] = await Promise.all([
      App.getInfo(),
      fetch(VERSION_API, {
        method: 'GET',
        cache: 'no-store',
      }),
    ]);

    if (!response.ok) {
      return null;
    }

    const latest = await response.json();

    if (!latest.version || !latest.apk_url) {
      return null;
    }

    const currentParts = appInfo.version
      .split('.')
      .map(Number);

    const latestParts = latest.version
      .split('.')
      .map(Number);

    const length = Math.max(
      currentParts.length,
      latestParts.length
    );

    let hasUpdate = false;

    for (let i = 0; i < length; i++) {
      const current = currentParts[i] || 0;
      const available = latestParts[i] || 0;

      if (available > current) {
        hasUpdate = true;
        break;
      }

      if (available < current) {
        break;
      }
    }

    if (!hasUpdate) {
      return null;
    }

    return {
      currentVersion: appInfo.version,
      latestVersion: latest.version,
      releaseName: latest.name || 'Ratio Update',
      notes: latest.notes || '',
      apkUrl: latest.apk_url,
    };
  } catch (error) {
    console.error('Pemeriksaan pembaruan gagal:', error);
    return null;
  }
}
