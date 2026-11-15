# DuniaTahu

**DuniaTahu** is an educational knowledge app that helps people explore everyday questions and discover interesting facts. It combines an AI-powered question experience with a daily fact feature in a simple web and Android app.

The project is built with React and Vite, uses Cloudflare for its backend infrastructure, and integrates Google Gemini for AI-generated responses.

## Features

- **Ask World** — ask questions and receive clear, accessible explanations powered by Google Gemini.
- **Daily Fact** — discover a new knowledge fact each day.
- **Question history** — revisit previous questions and answers.
- **Language selection** — use the app in Indonesian or English.
- **Appearance settings** — choose the app's visual theme.
- **Web and Android** — use the web app or install the Android APK.

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | React, Vite, JavaScript |
| UI | Tailwind CSS, Radix UI, Lucide |
| Mobile | Capacitor |
| Hosting | Cloudflare Pages |
| Backend API | Cloudflare Workers |
| Database and daily-fact cache | Cloudflare D1 |
| AI provider | Google Gemini API — Gemini 3.5 Flash-Lite |
| Android automation | GitHub Actions, Gradle |

## Architecture

```text
                   ┌──────────────────────┐
                   │   DuniaTahu Client   │
                   │   React + Vite       │
                   │   Web / Android      │
                   └──────────┬───────────┘
                              │ HTTPS
                              ▼
                   ┌──────────────────────┐
                   │  Cloudflare Worker  │
                   │    duniatahu-api     │
                   └───────┬────────┬─────┘
                           │        │
                 AI request│        │Daily fact data
                           ▼        ▼
                 ┌─────────────┐  ┌─────────────┐
                 │ Google      │  │ Cloudflare  │
                 │ Gemini API │  │ D1 Database │
                 └─────────────┘  └─────────────┘

        Web frontend hosting: Cloudflare Pages
        Android build pipeline: GitHub Actions
```

### Backend endpoints

The Cloudflare Worker exposes the following endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/askWorld` | Generate an answer to a user's question |
| POST | `/api/dailyFact` | Retrieve or generate the daily fact |
| GET | `/api/version` | Check the latest Android release |

The Daily Fact service stores facts in Cloudflare D1 by date and language, allowing the generated fact to be reused instead of regenerated for every request.

## Run Locally

### Prerequisites

- Node.js 22 or a compatible recent Node.js version
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/kdrryan/DuniaTahu.git
cd DuniaTahu
```

### 2. Install dependencies

```bash
npm ci
```

### 3. Configure the API URL

Create a `.env.local` file in the project root:

```env
VITE_API_BASE_URL=https://duniatahu-api.christainmichael22.workers.dev
```

The API URL can be changed to point to another compatible backend environment.

### 4. Start the development server

```bash
npm run dev -- --host 0.0.0.0
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

### 5. Create a production web build

```bash
npm run build
```

The production files are generated in the `dist/` directory.

## Cloudflare Backend

The backend source code is in `workers/worker.js`, and its Cloudflare configuration is in `wrangler.toml`.

The Worker uses:

- **Gemini API:** configured through the `GEMINI_API_KEY` Worker secret.
- **D1:** configured through the `DB` binding in `wrangler.toml`.

Never commit API keys, credentials, signing files, or other secrets to the repository. Configure sensitive values through Cloudflare Worker secrets and GitHub Actions secrets.

## Android Build

DuniaTahu uses Capacitor to package the web application as an Android app. The Capacitor configuration is in `capacitor.config.ts`.

A GitHub Actions workflow builds the signed release APK:

1. Open the repository's **Actions** tab.
2. Select **Build DuniaTahu APK**.
3. Select **Run workflow** on the `main` branch.
4. Leave `release_tag` empty to build an APK artifact only.
5. Download the generated APK from the completed workflow run's artifacts.

To publish an Android release, run the workflow with a version tag such as `v1.2.3`. The workflow creates a GitHub Release and attaches the APK.

The Android signing keystore and passwords are supplied through GitHub Actions secrets. The permanent signing key must be preserved for future updates.

## Project Structure

```text
DuniaTahu/
├── .github/
│   └── workflows/
│       └── build-android.yml
├── android/                 # Capacitor Android project
├── public/                  # Static assets
├── src/                     # React application
├── workers/
│   └── worker.js            # Cloudflare Workers API
├── capacitor.config.ts      # Capacitor configuration
├── package.json
├── wrangler.toml            # Cloudflare Worker and D1 config
└── vite.config.js
```

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the production frontend |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript checks |

## Deployment Overview

- **Frontend:** deployed to Cloudflare Pages.
- **Backend:** deployed as the `duniatahu-api` Cloudflare Worker.
- **Android:** built and distributed through GitHub Actions and GitHub Releases.

Frontend and backend deployments are independent. Changes limited to the Cloudflare Worker do not require a new Android APK.

---

Made with curiosity by [@kdrryan](https://github.com/kdrryan).
