# DuniaTahu

<p align="center">
  <strong>Discover more. Understand better.</strong><br />
  An AI-powered educational app for clear answers and daily discoveries.
</p>

<p align="center">
  <a href="https://duniatahu.pages.dev"><strong>Open Web App</strong></a>
  · <a href="https://github.com/kdrryan/DuniaTahu/releases">Android Releases</a>
  · <a href="https://github.com/kdrryan/DuniaTahu/issues">Report an Issue</a>
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-Frontend-149eca?logo=react&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-Build-646CFF?logo=vite&logoColor=white" />
  <img alt="Cloudflare" src="https://img.shields.io/badge/Cloudflare-Platform-F38020?logo=cloudflare&logoColor=white" />
  <img alt="Google Gemini" src="https://img.shields.io/badge/Google_Gemini-AI-8E75B2?logo=googlegemini&logoColor=white" />
  <img alt="Android" src="https://img.shields.io/badge/Android-App-3DDC84?logo=android&logoColor=white" />
</p>

---

## About

**DuniaTahu** is a learning-focused app for curious people. It turns questions into understandable explanations and makes discovering something new part of the daily routine.

The project is available on the web and Android. Its frontend uses React and Vite, while Cloudflare and Google Gemini power the backend experience.

## Features

- **Ask World** — ask questions and get clear, accessible AI-generated explanations.
- **Daily Fact** — discover an interesting knowledge fact every day.
- **Question history** — revisit previous questions and answers.
- **Bilingual experience** — switch between Indonesian and English.
- **Appearance settings** — personalize the app's visual theme.
- **Web and Android** — access DuniaTahu in a browser or install the Android app.

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | React, Vite, JavaScript |
| UI | Tailwind CSS, Radix UI, Lucide |
| Mobile | Capacitor |
| Web hosting | Cloudflare Pages |
| Backend API | Cloudflare Workers |
| Database and daily-fact cache | Cloudflare D1 |
| AI | Google Gemini API — Gemini 3.5 Flash-Lite |
| Android automation | GitHub Actions, Gradle |

## Architecture

```text
Web / Android
     |
     v
React + Vite (Cloudflare Pages)
     | HTTPS
     v
Cloudflare Worker (duniatahu-api)
     |------------------|
     v                  v
Google Gemini       Cloudflare D1
```

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | /api/askWorld | Generate an answer to a question |
| POST | /api/dailyFact | Retrieve or generate the daily fact |
| GET | /api/version | Check the latest Android app version |

Daily facts are cached in D1 by date and language to avoid unnecessary regeneration.

## Try the App

- **Web:** https://duniatahu.pages.dev
- **Android:** https://github.com/kdrryan/DuniaTahu/releases

## Run Locally

Requirements: Node.js 22 (or a compatible recent version), npm, and Git.

```bash
git clone https://github.com/kdrryan/DuniaTahu.git
cd DuniaTahu
npm ci
```

Create a .env.local file in the project root:

```env
VITE_API_BASE_URL=https://duniatahu-api.christainmichael22.workers.dev
```

Start the development server and build the frontend:

```bash
npm run dev
npm run build
```

## Backend Configuration

The Cloudflare Worker source is in workers/worker.js; its configuration is in wrangler.toml.

- Configure the Gemini key as the Worker secret GEMINI_API_KEY.
- The D1 database is connected through the DB binding.
- Never commit API keys, credentials, signing files, or other secrets. Use Cloudflare Worker secrets and GitHub Actions secrets.

## Android Build and Release

The Capacitor Android project is built by .github/workflows/build-android.yml.

To build an APK artifact, open **Actions** → **Build DuniaTahu APK** → **Run workflow** on main, and leave release_tag empty. Download the APK from the completed workflow run's artifacts.

To publish a GitHub Release, provide a version tag such as v1.2.3 in release_tag. The workflow attaches the APK to that release.

The Android signing keystore and passwords are provided through GitHub Actions secrets. Preserve the permanent signing key for future updates.

## Project Structure

```text
DuniaTahu/
├── .github/workflows/       # GitHub Actions workflows
├── android/                 # Capacitor Android project
├── public/                  # Static assets
├── src/                     # React application
├── workers/worker.js        # Cloudflare Workers API
├── capacitor.config.ts
├── package.json
├── wrangler.toml
└── vite.config.js
```

## Useful Commands

| Command | Description |
| --- | --- |
| npm run dev | Start the Vite development server |
| npm run build | Build the production frontend |
| npm run preview | Preview the production build |
| npm run lint | Run ESLint |
| npm run typecheck | Run TypeScript checks |

## Deployment

- **Frontend:** Cloudflare Pages
- **Backend:** Cloudflare Worker duniatahu-api
- **Android:** GitHub Actions and GitHub Releases

Frontend, backend, and Android delivery are independent. Worker-only changes do not require a new Android APK.

---

<p align="center">Made with curiosity by <a href="https://github.com/kdrryan">@kdrryan</a>.</p>
