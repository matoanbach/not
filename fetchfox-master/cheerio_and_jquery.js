// Import 'dotenv' and OpenAI API client in ES Modules style
import dotenv from "dotenv";
import OpenAI from "openai";
import * as cheerio from "cheerio";
import fetch from "node-fetch";

function print(msg) {
  console.log(msg);
}

// Load environment variables from .env file
dotenv.config();
const HACKER_NEWS_URL = "https://news.ycombinator.com/news";
const linked_in =
  "https://www.linkedin.com/jobs/search/?currentJobId=3995310624&keywords=software%20engineer&origin=JOBS_HOME_KEYWORD_AUTOCOMPLETE&refresh=true";

// start to use node-fetch
async function scrapeHackerNews() {
  try {
    // Fetch HTML content
    const html = await fetchHTML(HACKER_NEWS_URL);
    // Extract new articles from HTML
    const news = extractNewsFromHTML(html);
    // Log the news articles
    console.log(news);
  } catch (error) {
    console.log("An error occurred while scraping Hacker News:", error);
  }
}
// Function to fetch HTML content from a given URL
async function fetchHTML(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch page, status: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.log("An error occurred while fetchHTML-ing Hacker News:", error);
  }
}

// Function to extract news articles from the HTML content using Cheerio
function extractNewsFromHTML(html) {
  const news = [];
  const $ = cheerio.load(html);
  // Iterate over each news entry with class "athing"
  $("tr.athing").each((index, element) => {
    // Extract the title and additional details
    const athing = $(element);
    // Add the extracted information to the news array
    const title = $(athing).find(".titleline").text().trim();
    const details = athing.next().text().trim();
    news.push({ title: title, details: details });
  });
  return news
}

// Invoke the scraping function
scrapeHackerNews();
