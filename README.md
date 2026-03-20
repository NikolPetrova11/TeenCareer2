# TeenCareer

TeenCareer is a Node.js + Express web app aimed at helping teenagers and young people prepare for their first job. The project combines a static multi-page frontend with a backend that handles authentication, profile data, saved CVs/portfolios, favorite job listings, AI-assisted chat, and CV analysis.

The app is primarily in Bulgarian and serves HTML/CSS/JS files directly from the project root.

## What the project does

- Landing page with login and registration
- Job-search flow and saved favorites
- CV builder and portfolio PDF generation
- Profile page with saved CVs and portfolios
- AI chat flow for career guidance
- CV upload and AI-based career recommendations
- Daily job scraping into `jobs.json`

## Tech stack

- Node.js
- Express
- MongoDB + Mongoose
- Express sessions stored in MongoDB
- Nodemailer for email verification
- PDFKit for PDF generation
- Hugging Face Inference for CV analysis
- Static HTML/CSS/JS frontend

## Project structure

- `server.js`: main Express server and backend routes
- `index.html`: landing page
- `searching.html`: career search/chat flow
- `jobs.html`: job listings page
- `CV_maker.html`: CV and portfolio builder UI
- `profile.html`: logged-in user profile
- `edit-profile.html`: profile editing page
- `tips.html`: CV upload and advice page
- `scraper.js`: scheduled job scraper
- `jobs.json`: job data used by `jobs.html`
- `photos/`: image assets
- `uploads/`, `uploaded_portfolios/`: uploaded/generated files
- `render.yaml`, `render-build.sh`: Render deployment files

## Requirements

- Node.js 18+ recommended
- npm
- MongoDB
  You can use a local MongoDB instance or MongoDB Atlas.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create or update `.env` in the project root.

Expected environment variables:

```env
MONGODB_URI=mongodb://localhost:27017/teencareer2
SESSION_SECRET=replace_with_a_long_random_secret
EMAIL_USER=your_email_account
EMAIL_PASS=your_email_app_password
HF_API_KEY_1=your_huggingface_api_key
```

Notes:

- `MONGODB_URI` is optional because `server.js` falls back to `mongodb://localhost:27017/teencareer2`.
- `EMAIL_USER` and `EMAIL_PASS` are optional for local development, but registration email verification will not work without them.
- `HF_API_KEY_1` is required for the CV analysis feature in `tips.html`.
- There is a checked-in `.env` in this repo. Treat any real secrets as compromised and rotate them before using this project anywhere real.

## How to run

Start only the web app:

```bash
npm run server
```

Then open:

```text
http://localhost:3000
```

Start the web app and scraper together:

```bash
npm run dev
```

Useful commands:

- `npm run server`: starts the Express app
- `npm run scrape`: runs the scraper process
- `npm run dev`: runs both server and scraper with `concurrently`

## First-time run checklist

1. Run `npm install`
2. Make sure MongoDB is available
3. Add a valid `.env`
4. Run `npm run server`
5. Open `http://localhost:3000`

## Backend behavior

- The server serves static files from the project root with `express.static(__dirname)`.
- The app listens on port `3000`.
- Sessions are stored in MongoDB through `connect-mongo`.
- If MongoDB connection fails, `server.js` switches into a mock-mode message path, but most real persistence features still depend on MongoDB being available.

## Main routes and pages

Pages:

- `/` -> `index.html`
- `/profile` -> `profile.html` for logged-in users
- `/edit-profile` -> `edit-profile.html` for logged-in users
- `/jobs.html`
- `/searching.html`
- `/CV_maker.html`
- `/tips.html`

Important API/backend routes:

- `POST /login`
- `POST /register`
- `GET /verify`
- `GET /logout`
- `GET /api/user-data`
- `GET /api/chat-history`
- `POST /api/chat-history`
- `POST /save-cv`
- `POST /save-portfolio`
- `POST /generate-pdf`
- `POST /generate-portfolio`
- `POST /api/analyze-cv`
- `POST /add-favorite`
- `POST /remove-favorite`
- `GET /get-favorites`
- `POST /chat`

## Scraper

`scraper.js` is intended to scrape jobs from `jobs.bg` and write them into `jobs.json`.

Current behavior:

- It runs immediately only if `jobs.json` does not exist
- It is also scheduled to run every day at `09:00`
- It preserves manually added jobs when they have `custom: true`

Important note:

- The scraper imports `puppeteer`, but `puppeteer` is not currently listed in `package.json`, so `npm run scrape` is likely to fail until that dependency is added.

## Known issues and quirks

- `npm install` must be run before anything else; the repo does not include `node_modules`.
- `server.js` hardcodes port `3000` instead of reading `process.env.PORT`.
- `cv_portfolio.js` still references `upload_portfolio.php`, but there is no PHP backend file in this repo.
- Some text in source files appears to have encoding issues in the terminal output, though the HTML files themselves are intended for Bulgarian content.
- There are PHP Composer files (`composer.json`, `composer.lock`) in the repo, but the active app runtime appears to be Node.js, not PHP.

## Deployment

The repo includes `render.yaml` for Render. It starts the app with:

```bash
npm run server
```

## Suggested next cleanup tasks

- Add a `.env.example`
- Move uploaded/generated files to ignored storage paths
- Add `puppeteer` if the scraper is still needed
- Remove or replace the leftover PHP upload reference
- Make the server use `process.env.PORT`
- Split backend and frontend assets into clearer folders
- Add a proper README section for contributor workflow and testing
