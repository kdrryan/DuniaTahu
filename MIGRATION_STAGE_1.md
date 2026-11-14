# DuniaTahu migration — Stage 1

## Completed in this patch
- Removed `AuthProvider` and the Base44 authentication gate from the active app entry point (`src/App.jsx`).
- Removed the Base44 user lookup from the 404 page (`src/lib/PageNotFound.jsx`).
- Renamed the npm package from `base44-app` to `duniatahu`.

## Important: not yet fully independent
The Home page still calls `dailyFact` and `askWorld` through Base44 Functions in `src/lib/api.js`. The Base44 SDK and Vite plugin are intentionally retained for now so we do not break the existing AI and daily-fact functionality before replacing those services in a later migration stage.

The old login/register/MFA source files remain in the archive as inactive legacy files. They are no longer imported by the active app route tree. They can be deleted after the migration is tested.

## Next stage
Replace the Base44 Functions used by `src/lib/api.js` with an independent backend API, then remove `@base44/sdk`, `@base44/vite-plugin`, and Base44-only configuration safely.
