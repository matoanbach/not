// ENV
import * as dotenv from "dotenv";
dotenv.config();

// DEPENDENCIES
import path from "path";
import { LinkedInScraper2 } from "./LinkedInScraper2.js";

// FILE PATH
const __dirname = import.meta.dirname;
const __cookie_path = path.join(__dirname, "./playwright/.auth/user.json");

// SELECTORS
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
  noJobsFound: "Show 0 results",
  popUp: "I understand the tips and",
};

// FILTERS
const filters = new Set(["Past 24 hours", "Internship", "Canada"]);

// SCRAPER INSTANCE
const scraper = new LinkedInScraper2(
  __cookie_path,
  filters,
  process.env.LINKEDIN_MAIL,
  process.env.LINKEDIN_PASSWORD,
  process.env.LINKEDIN_URL,
  process.env.LINKEDIN_JOB_URL,
  SELECTORS,
  false,
  false
);

export { scraper };
