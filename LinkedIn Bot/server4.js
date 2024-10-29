// ENV
import * as dotenv from "dotenv";
dotenv.config();

// DEPENDENCIES
import playwright from "playwright";
import path from "path";
import fs from "fs";
import { LinkedInScraper2 } from "./src/scraper2/LinkedInScraper2.js";

// FILE PATH
const __dirname = import.meta.dirname;
const __cookie_path = path.join(__dirname, "./playwright/.auth/user.json");

// Selectors

// Filters
// Selectors
const SELECTORS = {
  jobListContainer: ".scaffold-layout__list-container",
  jobListItem: 'li[id^="ember"]',
  jobDetailsContainer:
    ".job-details-jobs-unified-top-card__container--two-pane",
  applyButton: ".jobs-apply-button--top-card",
  filterListItem: 'li[class="search-reusables__filter-value-item"]',
  showAllJobsButton: 'text="Show all jobs"',
  allFiltersButton: 'text="All filters"',
  showResultsButton: "text=/show \\d+ result(s)?/i",
  showResultsButton2: "Apply current filters to show",
  isHeadless: true,
  allowEasyApply: false,
};

const filters = new Set(["Past 24 hours", "Internship", "Canada"]);
const jobAlerts = [
  "web development intern",
  "mobile developer intern",
  "ai engineer intern",
  "software development intern",
  "frontend developer intern",
  "fullstack developer intern",
  "software developer intern",
  "software engineering",
];
const scrapeBot = new LinkedInScraper2(
  __cookie_path,
  filters,
  process.env.LINKEDIN_MAIL,
  process.env.LINKEDIN_PASSWORD,
  process.env.LINKEDIN_URL,
  jobAlerts,
  SELECTORS
);

await scrapeBot.setUp();
await scrapeBot.run();
