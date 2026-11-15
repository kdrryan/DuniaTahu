import { useEffect, useRef, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { LanguageProvider } from '@/lib/LanguageContext';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import { checkForUpdate } from '@/lib/appUpdater';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function App() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const updateDialogOpenRef = useRef(false);

  useEffect(() => {
    let active = true;
    let checking = false;
    let appStateListener = null;

    const checkUpdate = async () => {
      if (checking || updateDialogOpenRef.current) {
        return;
      }

      checking = true;

      try {
        const update = await checkForUpdate();

        if (active && update) {
          updateDialogOpenRef.current = true;
          setUpdateInfo(update);
        }
      } finally {
        checking = false;
      }
    };

    // Check immediately when the app starts.
    checkUpdate();

    // Check again whenever the app returns to the foreground.
    CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        checkUpdate();
      }
    }).then((listener) => {
      if (active) {
        appStateListener = listener;
      } else {
        listener.remove();
      }
    }).catch((error) => {
      console.error('Pemeriksaan status aplikasi gagal:', error);
    });

    return () => {
      active = false;
      appStateListener?.remove();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <ScrollToTop />

        <LanguageProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </LanguageProvider>

        <AlertDialog
          open={Boolean(updateInfo)}
          onOpenChange={(open) => {
            if (!open) {
              updateDialogOpenRef.current = false;
              setUpdateInfo(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Ratio Update Available!
              </AlertDialogTitle>

              <AlertDialogDescription>
                A new version ({updateInfo?.latestVersion}) is available.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>
                Later
              </AlertDialogCancel>

              <AlertDialogAction
                onClick={() => {
                  if (updateInfo?.apkUrl) {
                    Browser.open({ url: updateInfo.apkUrl });
                  }
                }}
              >
                Update Now
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
