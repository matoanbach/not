# linkedin-bot

Product name: `linkedin-bot`.
Repository name: `LinkedIn Bot`.
GitHub repository: not documented in this workspace.

`linkedin-bot` is a personal automation project for monitoring LinkedIn job postings and forwarding relevant roles to Discord channels. It is built for internship and early-career job discovery, with filtering, deduplication, AI-based job validation, and simple storage for previously seen postings.

## Who It's For

People:
- Students looking for internship or co-op roles.
- Early-career candidates tracking LinkedIn job openings.
- Small student groups or clubs that want shared job alerts in Discord.

Use cases:
- Monitor fresh LinkedIn postings with a fixed set of filters.
- Avoid reposting the same job repeatedly.
- Forward shortlisted jobs into Discord for manual review.
- Practice browser automation, cloud storage, and notification workflows.

## What It Does

This project includes:
- LinkedIn login automation with Playwright and saved session cookies.
- Scraping of LinkedIn job listings and apply links.
- UI-based filtering for terms like `Past 24 hours`, `Internship`, and `Canada`.
- Extraction of job title, company, location, and destination URL.
- OpenAI-based validation to decide whether a posting is a CS-related internship/co-op in English.
- DynamoDB storage for seen jobs with a 14-day TTL to suppress duplicates.
- Discord webhook delivery for approved job postings.
- A small Express API for reading, creating, and deleting jobs from the backing store.

In plain terms, the bot logs into LinkedIn, looks for matching jobs, filters out duplicates and irrelevant posts, and sends the remaining jobs to Discord channels.

## Tech Stack

- Node.js
- Playwright
- Express
- DynamoDB (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`)
- OpenAI API
- `node-fetch`
- `dotenv`
- `cheerio` is installed, though the current main flow is Playwright-driven

## Project Layout

- Main scraper entrypoint: `server6.js`
- Older experimental entrypoints: `server.js`, `server4.js`, `server5.js`
- Express API server: `db_server.js`
- API routes: `routes.js`
- Scraper implementation: `src/scraper2/LinkedInScraper2.js`
- Scraper configuration/bootstrap: `src/scraper2/scraper.js`
- Older scraper implementation: `src/scraper/LinkedInScraper.js`
- DynamoDB access layer: `src/database/db.js`, `src/database/db.config.js`
- Validation + webhook utilities: `src/utils/util.js`
- Sample filter config: `job-filter.json`

## Run Locally

Requirements:
- Node.js `22.x` is the version implied by `package.json`.
- A LinkedIn account.
- AWS credentials with access to the DynamoDB table used by this project.
- An OpenAI API key if you want AI-based job validation enabled.
- One or more Discord webhook URLs.

Install dependencies:

```bash
npm install
```

Run the main job scraping + Discord notification flow:

```bash
node server6.js
```

Run the Express API server:

```bash
node db_server.js
```

Then open the API locally at:

```text
http://localhost:8000
```

Current API routes:
- `GET /` health-style hello response
- `GET /api/jobs` list saved jobs
- `GET /api/job/:id` get one saved job
- `POST /api/job` create a saved job record
- `PUT /api/job/:id` update path exists, but currently calls the same create flow
- `DELETE /api/user/:id` delete path exists, though the route name uses `user` instead of `job`

## Environment Variables

Documented in `.env.example`:
- `LINKEDIN_MAIL`
- `LINKEDIN_PASSWORD`
- `LINKEDIN_URL`
- `LINKEDIN_JOB_URL`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `OPEN_AI_API_KEY`
- `WEB_HOOK_URL`

Used by the current main flow in `server6.js` and helpers:
- `LINKEDIN_MAIL`
- `LINKEDIN_PASSWORD`
- `LINKEDIN_URL`
- `LINKEDIN_JOB_URL`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `OPEN_AI_API_KEY`
- `SESS_WEB_HOOK_URL`
- `SDG_WEB_HOOK_URL`

Important note:
- `.env.example` is out of date. The current main workflow expects `SESS_WEB_HOOK_URL` and `SDG_WEB_HOOK_URL`, not just `WEB_HOOK_URL`.

## How It Works

### Current Main Flow

The current end-to-end workflow appears to be `server6.js`.

It does the following:
- Removes expired jobs from the DynamoDB table by checking their TTL.
- Starts the scraper and reuses saved LinkedIn session cookies when available.
- Visits LinkedIn job pages / alerts and applies built-in UI filters.
- Extracts job metadata from the LinkedIn page.
- Skips jobs that were already seen recently.
- Uses OpenAI to decide whether a job is relevant to CS internships/co-ops.
- Sends approved jobs to Discord webhooks.
- Stores accepted jobs so they are not reposted during the TTL window.

### Scraping Behavior

The scraper is browser-automation based, not API-based.

That means it depends on LinkedIn's current HTML structure and UI labels such as:
- `Show all jobs`
- `All filters`
- `Apply current filters to show`

The scraper also opens apply links in a new tab, captures the final URL, and closes the tab after extraction.

### Storage Behavior

Saved jobs are stored in a DynamoDB table named `jobs`.

Each stored record includes:
- job title
- company
- location
- apply URL
- a derived partition key in the form `jobTitle#company`
- a `timetolive` value used as a 14-day expiration marker

This is used to avoid reposting the same job repeatedly.

### Validation Behavior

The OpenAI validation step asks the model whether a job is:
- related to computer science
- an internship or co-op style role
- written in English

If the model returns `isCSJob: true`, the job continues through the pipeline.

## Data And Notification Flow

High-level flow:

1. Playwright logs into LinkedIn or reuses existing cookies.
2. The scraper loads LinkedIn jobs and applies filters.
3. Job details and apply URLs are extracted from each listing.
4. DynamoDB is checked for recent duplicates.
5. OpenAI validates whether the role is relevant.
6. Matching jobs are stored in DynamoDB.
7. Matching jobs are sent to Discord webhooks.

## API Notes

The included Express API is small and currently acts as a thin CRUD layer over the DynamoDB table.

Behavior notes:
- `GET /api/jobs` uses a table scan.
- `GET /api/job/:id` reads by the partition key.
- `POST /api/job` writes an item directly.
- `PUT /api/job/:id` is not a true update implementation yet.
- `DELETE /api/user/:id` likely has a route naming mistake and should probably be `/api/job/:id`.

## Known Limitations

- The scraper is brittle because it relies on LinkedIn UI text and DOM structure.
- There are multiple server entrypoints, which makes the intended production path unclear.
- `package.json` does not define usable `start` or `dev` scripts.
- `.env.example` does not match the latest webhook variable names.
- Older files contain hardcoded Discord webhook URLs, which is unsafe.
- The DynamoDB table schema is implicit in code and not documented separately.
- The API routes are functional but lightly structured and have naming inconsistencies.
- There are no automated tests.

## What To Improve

Security:
- Remove hardcoded webhook URLs from older entrypoints.
- Keep all webhook and credential configuration in environment variables only.
- Add input validation and error handling around API writes.

Engineering quality:
- Consolidate `server.js`, `server4.js`, `server5.js`, and `server6.js` into a single supported entrypoint.
- Add npm scripts for scraping and API modes.
- Update `.env.example` to reflect the actual required variables.
- Add tests for the DynamoDB helpers and utility functions.
- Document the expected DynamoDB table schema and indexes.

Product behavior:
- Make job filters configurable instead of hardcoded in `src/scraper2/scraper.js`.
- Add better deduplication rules beyond `jobTitle#company`.
- Add scheduling support if the bot is intended to run periodically.
- Add logs or summaries for how many jobs were scanned, rejected, stored, and sent.

Reliability:
- Improve retry handling around LinkedIn page transitions and popups.
- Add fallback parsing when specific selectors change.
- Add structured logs for failures in scraping, OpenAI validation, DynamoDB writes, and Discord delivery.
