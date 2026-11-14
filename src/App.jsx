import { useEffect, useState } from 'react';
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

  useEffect(() => {
    let active = true;

    const checkUpdate = async () => {
      const update = await checkForUpdate();

      if (active && update) {
        setUpdateInfo(update);
      }
    };

    checkUpdate();

    return () => {
      active = false;
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
            if (!open) setUpdateInfo(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                DuniaTahu Update Available!
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
