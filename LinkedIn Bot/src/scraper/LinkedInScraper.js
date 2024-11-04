import fs from "fs";
import playwright from "playwright";
let allowEasyApply = false;
export class LinkedInScraper {
  constructor(
    cookie_path,
    optionalFilters,
    requiredFilters,
    selectors,
    email,
    password,
    linkedin_url
  ) {
    this.cookie_path = cookie_path;
    this.optionalFilters = new Set(optionalFilters);
    this.requiredFilters = new Set(requiredFilters);
    this.selectors = selectors;
    this.email = email;
    this.password = password;
    this.linkedin_url = linkedin_url;

    this.context = null;
    this.browser = null;
    this.page = null;
  }

  async setUp() {
    this.browser = await playwright.chromium.launch({
      headless: this.selectors.isHeadless || false,
      args: ["--use-gl=egl"],
    });
    if (await this.checkCookie()) {
      console.log("[Set Up]: Done");
    } else {
      console.log("[Set Up]: Failed");
    }
  }

  // assume user is only able to use this function
  async browse(companyURL) {
    if (!this.page) this.page = await this.context.newPage();

    // visit the company linkedin job page
    // await this.page.goto(companyURL, { waitUntil: "domcontentloaded" });
    await this.page.goto(companyURL);

    // show all jobs
    if (
      !(await this.page.locator(this.selectors.showAllJobsButton).isVisible())
    ) {
      return [];
    }
    await this.click(
      this.page,
      this.page.locator(this.selectors.showAllJobsButton)
    );

    // apply filter to see any job exist
    const foundJob = await this.applyFilter(this.page);
    if (!foundJob) return [];
    // extract jobs
    return await this.browserJobs(this.page);
  }

  async applyFilter(page) {
    // toggle the filter panel
    await this.openFilterPanel(page);
    // collect filter keywords
    const { filterKeywords, filterList } = await this.collectFilterKeywords(
      page
    );

    // check if they have all required keywords
    for (const requireFilter of this.requiredFilters)
      if (!filterKeywords.includes(requireFilter)) return false;

    // apply selected filters
    await this.applyOptionalFilter(page, this.optionalFilters, filterList);

    // click show result to see if there is any job existed
    return await this.clickShowResults(page);
  }

  async openFilterPanel(page) {
    // Click on "All filters"
    await page.waitForSelector(this.selectors.allFiltersButton);
    await this.click(
      page,
      page.locator(this.selectors.allFiltersButton, { exact: true })
    );

    // Wait for the filters panel to appear
    await page.waitForSelector(this.selectors.filterListItem);
  }

  async collectFilterKeywords(page) {
    // Locate all filter list items
    const filterList = await page.locator(this.selectors.filterListItem);
    const count = await filterList.count();

    // Initialize an array to accumulate filter keywords
    let filterKeywords = [];

    // Collect keywords from all filter items
    for (let i = 0; i < count; i++) {
      const rawString = await filterList.nth(i).textContent();

      // Process the raw string to extract keywords
      const keywords = rawString
        .replace(/\s{2,}/g, ";;")
        .split(";;")
        .map((str) => str.trim())
        .filter(
          (str) => str.length > 0 && !str.toLowerCase().includes("filter")
        );

      // Accumulate keywords
      filterKeywords = filterKeywords.concat(keywords);
    }
    return { filterKeywords, filterList };
  }

  async applyOptionalFilter(page, filterKeyword, filterList) {
    // Iterate over the keywords using for...of to handle async/await properly
    for (const keyword of filterKeyword) {
      // console.log(keyword);
      if (this.optionalFilters.has(keyword)) {
        // Locate the checkbox or filter option by label or text
        const filterOption = filterList.locator(`text="${keyword}"`);

        // Check if the filter option exists
        const optionCount = await filterOption.count();
        if (optionCount > 0) {
          // Click on the filter option
          await this.click(page, filterOption.first());
        } else {
          console.warn(`Filter option "${keyword}" not found.`);
        }
      }
    }
  }

  async clickShowResults(page) {
    // Apply the filters by clicking the "Show results" or equivalent button
    // Adjust the selector as needed
    await page.waitForTimeout(500); // Playwright clicks too fast, wait a bit for the button loaded
    const showResultButton = await page.getByLabel(
      this.selectors.showResultsButton2
    );

    const showResultsButtonText = await showResultButton.textContent();
    if (showResultsButtonText.includes("Show 0 results")) {
      // no job found after applying filter
      return false;
    }

    // await page.click(this.selectors.showResultsButton);
    this.click(page, showResultButton);

    // Wait for the results to load
    await page.waitForTimeout(500);
    return true;
  }

  async browserJobs(page) {
    const results = [];
    let current_page = 1;
    await page.waitForTimeout(1000);
    while (current_page === 1 || (await this.isPageExist(page, current_page))) {
      //use the mouse to scroll down with the space bar to load all jobs first
      await this.click(
        page,
        page.getByLabel(`Page ${current_page}`, { exact: true })
      );
      await this.scroll(page, 10);

      const job_list_div = await page.locator(this.selectors.jobListContainer);
      const job_list = await job_list_div.locator(this.selectors.jobListItem);
      const count = await job_list.count();

      // await page.waitForLoadState();

      for (let i = 0; i < count; i++) {
        await this.click(page, job_list.nth(i));
        const urlString = await this.openLink(page);
        if (urlString === "-1") continue;

        const { company, job_title, location } = await this.extractJob(page);

        results.push({ job_title, company, location, urlString });
      }
      current_page++;
    }
    // await page.pause();
    return results;
  }

  // utils
  async checkCookie() {
    try {
      if (
        this.cookie_path &&
        fs.existsSync(this.cookie_path) &&
        fs.readFileSync(this.cookie_path).length > 0
      ) {
        this.context = await this.browser.newContext({
          storageState: this.cookie_path,
        });
        this.print(`checkCookie(): Cookies reused from ${this.cookie_path}`);
      } else {
        this.context = await this.browser.newContext();
        const temp_page = await this.context.newPage(); // Create a new page to login in
        await this.signIn(temp_page);
        await temp_page.context().storageState({ path: this.cookie_path });
        await temp_page.close();
        this.print(
          "checkCookie(): New cookies created at playwright/.auth.json"
        );
      }
      this.page = await this.context.newPage();
      return true;
    } catch (error) {
      console.error("checkCookie(): Error - ", error);
      return false;
    }
  }
  // async extractString() {}

  async isPageExist(page, current_page) {
    return await page
      .getByLabel(`Page ${current_page}`, { exact: true })
      .isVisible();
  }

  async click(page, elementToClick) {
    if (await elementToClick.isVisible()) {
      await elementToClick.click();
      await page.waitForTimeout(500);
    }
  }

  async scroll(page, turns) {
    for (let i = 0; i < turns; i++) {
      await page.mouse.wheel(0, 300);
      // await page.waitForTimeout(500); // Add a small delay
    }
  }

  async extractJob(body) {
    const job_des_div = await body.locator(this.selectors.jobDetailsContainer);
    const raw_job_des_div = await job_des_div.textContent();
    const descriptions = raw_job_des_div.replace(/\s{2,}/g, ";;").split(";;");
    const company = descriptions[1];
    const job_title = descriptions[4];
    const temp = descriptions[5].split("·");
    const location = temp[0];
    return { company, job_title, location };
  }

  async openLink(page) {
    // skip easy apply
    const rawString = await page
      .locator(this.selectors.applyButton, { exact: true })
      .first()
      .textContent();

    if (!allowEasyApply && rawString.includes("Easy")) {
      return "-1";
    }

    // page promise - reference: https://stackoverflow.com/questions/64277178/how-to-open-the-new-tab-using-playwright-ex-click-the-button-to-open-the-new-s
    const pagePromise = page.context().waitForEvent("page");
    await this.click(
      page,
      page.locator(this.selectors.applyButton, { exact: true }).first()
    );
    // await page.locator(jobs_apply_button, { exact: true }).first().click();
    const newPage = await pagePromise;

    // Wait for the new page to load completely
    await newPage.waitForLoadState();

    // Close the new page after processing
    await newPage.close();

    // return the new page URL
    return newPage.url();
  }

  async signIn(page) {
    try {
      await page.goto(this.linkedin_url);
      await page.getByRole("link", { name: "Sign in", exact: true }).click();
      await page.getByLabel("Email or phone").fill(this.email);
      await page.getByLabel("Password").fill(this.password);
      console.log("[Sign In]: Attempting to sign in manually...");
      await page.getByLabel("Sign in", { exact: true }).click();
      await page.waitForURL("**/feed/**");

      console.log("[Sign In]: Signed In");
      return true;
    } catch (error) {
      console.error("Error in signIn():", error);
      return false;
    }
  }

  print(msg) {
    console.log(msg);
  }

  async cleanUp() {
    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
  }
}
