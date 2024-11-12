import fs from "fs";
import playwright from "playwright";

export class LinkedInScraper2 {
  constructor(
    cookie_path,
    filters,
    email,
    password,
    linkedin_url,
    linkedin_job_url,
    selectors,
    isHeadless,
    allowEasyApply
  ) {
    this.cookie_path = cookie_path;
    this.filters = new Set(filters);
    this.email = email;
    this.password = password;
    this.linkedin_url = linkedin_url;
    this.linkedin_job_url = linkedin_job_url;
    this.selectors = selectors;
    this.isHeadless = isHeadless;
    this.allowEasyApply = allowEasyApply;
    this.context = null;
    this.browser = null;
    this.page = null;
    this.visited = new Set(); //a set of urls - to skip overlapping job openings
  }

  async setUp() {
    this.browser = await playwright.chromium.launch({
      headless: this.isHeadless,
    });
    if (await this.checkCookie()) {
      console.log("[Set Up]: Done");
    } else {
      console.log("[Set Up]: Failed");
    }
  }

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
        console.log(`checkCookie(): Cookies reused from ${this.cookie_path}`);
      } else {
        this.context = await this.browser.newContext();
        const temp_page = await this.context.newPage(); // Create a new temporary page to login in
        await this.signIn(temp_page);
        await temp_page.context().storageState({ path: this.cookie_path });
        await temp_page.close();
        console.log(
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

  async signIn(page) {
    try {
      console.log("[Sign In]: Attempting to sign in manually...");
      await page.goto(this.linkedin_url);
      await page.getByRole("link", { name: "Sign in", exact: true }).click();
      await page.getByLabel("Email or phone").fill(this.email);
      await page.getByLabel("Password").fill(this.password);
      await page.getByLabel("Sign in", { exact: true }).click();
      await page.waitForURL("**/feed/**");

      console.log("[Sign In]: Signed In");
      return true;
    } catch (error) {
      console.error("Error in signIn():", error);
      return false;
    }
  }
  async run() {
    return await this.browse(this.page);
  }

  async browse(page) {
    let results = [];

    if (!page) this.page = await this.context.newPage();
    // await page.pause();

    await page.goto(this.linkedin_job_url);
    await page.getByRole("button", { name: "Preferences" }).click();
    await page.getByRole("link", { name: "Job alerts" }).click();
    await page.getByRole("button", { name: /Show \d+ more/i }).click();

    const linkHandle = await page.getByRole("link", {
      name: "application developer intern",
    });
    // await page.pause();
    const parentDivHandle = await linkHandle.locator("xpath=../../../../../.."); // Moves up two levels
    const alertList = await parentDivHandle.locator("li");
    const count = await alertList.count();

    // Force the link to open in a new tab
    for (let i = 0; i < count; i++) {
      const link = await alertList.nth(i).getByRole("link");
      const href = await link.getAttribute("href");

      const newPage = await this.context.newPage();
      await newPage.goto(href);

      await newPage.waitForLoadState("load");

      // start to browse the job on a new tab
      let jobs = await this.browseThisPage(newPage);

      await newPage.close();

      results.push(...jobs);
    }
    return results;
  }

  async browseThisPage(page) {
    await this.click(page, page.locator(this.selectors.showAllJobsButton));

    // start to filter jobs with keywords
    if (!(await this.filter(page))) {
      // no further action if no job found
      return [];
    }

    return this.browserJobs(page);
  }

  async filter(page) {
    // toggle the filter panel
    await this.openFilter(page);
    // collect filter keywords
    const { filterKeywords, filterList } = await this.collectFilterKeywords(
      page
    );

    // apply selected filters
    await this.applyFilter(page, filterKeywords, filterList);

    // click show result to see if there is any job existed
    return await this.clickShowResults(page);
  }

  async openFilter(page) {
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

  async applyFilter(page, filterKeyword, filterList) {
    // Iterate over the keywords using for...of to handle async/await properly
    for (const keyword of filterKeyword) {
      // console.log(keyword);
      if (this.filters.has(keyword)) {
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
    if (showResultsButtonText.includes(this.selectors.noJobsFound)) {
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
        const urlString = await this.clickApply(page);

        // avoid overlapped job openings
        if (urlString === "-1" || this.visited.has(urlString)) {
          continue;
        } else {
          this.visited.add(urlString);
        }

        const { company, jobTitle, location } = await this.extractJob(page);

        results.push({ jobTitle, company, location, urlString });
      }
      current_page++;
    }
    // await page.pause();
    return results;
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

  async isPageExist(page, current_page) {
    return await page
      .getByLabel(`Page ${current_page}`, { exact: true })
      .isVisible();
  }

  // async clickApply(page) {
  //   // skip easy apply
  //   const rawString = await page
  //     .locator(this.selectors.applyButton, { exact: true })
  //     .first()
  //     .textContent();

  //   if (!this.allowEasyApply && rawString.includes("Easy")) {
  //     return "-1";
  //   }

  //   // page promise - reference: https://stackoverflow.com/questions/64277178/how-to-open-the-new-tab-using-playwright-ex-click-the-button-to-open-the-new-s
  //   const pagePromise = page.context().waitForEvent("page");
  //   await this.click(
  //     page,
  //     page.locator(this.selectors.applyButton, { exact: true }).first()
  //   );

  //   if (await page.getByLabel(this.selectors.popUp).isVisible()) {
  //     // there might be an unexpected popup
  //     await page.getByLabel(this.selectors.popUp).click();
  //   }

  //   // await page.locator(jobs_apply_button, { exact: true }).first().click();
  //   const newPage = await pagePromise;

  //   // Wait for the new page to load completely
  //   await newPage.waitForLoadState("domcontentloaded");

  //   // Close the new page after processing
  //   await newPage.close();

  //   // return the new page URL
  //   return newPage.url();
  // }

  async clickApply(page) {
    // Skip easy apply if not allowed
    // await page.pause();
    const applyButtonLocator = page
      .locator(this.selectors.applyButton, { exact: true })
      .first();
    const rawString = await applyButtonLocator.textContent();

    if (!this.allowEasyApply && rawString.includes("Easy")) {
      return "-1";
    }

    const maxRetries = 3;
    let retries = 0;
    let success = false;
    let newPage = null;

    while (retries < maxRetries && !success) {
      try {
        const rawString = await page
          .locator(this.selectors.applyButton, { exact: true })
          .first()
          .textContent();

        if (!this.allowEasyApply && rawString.includes("Easy")) {
          return "-1";
        }

        // page promise - reference: https://stackoverflow.com/questions/64277178/how-to-open-the-new-tab-using-playwright-ex-click-the-button-to-open-the-new-s
        const pagePromise = page.context().waitForEvent("page");
        await this.click(
          page,
          page.locator(this.selectors.applyButton, { exact: true }).first()
        );

        if (await page.getByLabel(this.selectors.popUp).isVisible()) {
          // there might be an unexpected popup
          await page.getByLabel(this.selectors.popUp).click();
        }

        // await page.locator(jobs_apply_button, { exact: true }).first().click();
        newPage = await pagePromise;
        
        // Wait for the new page to load completely
        await newPage.waitForLoadState("domcontentloaded");

        success = true;
      } catch (error) {
        console.warn(`Attempt ${retries + 1} failed:`, error.message);
        retries++;
        // Optionally wait before retrying
        await page.waitForTimeout(1000);
      }
    }

    if (!success) {
      console.error(
        "Failed to click the apply button after multiple attempts."
      );
      return null;
    }

    // Get the URL before closing
    const url = newPage.url();

    // Close the new page after processing
    await newPage.close();

    // Return the new page URL
    return url;
  }

  async extractJob(body) {
    const job_des_div = await body.locator(this.selectors.jobDetailsContainer);
    const raw_job_des_div = await job_des_div.textContent();
    const descriptions = raw_job_des_div.replace(/\s{2,}/g, ";;").split(";;");
    const company = descriptions[1];
    const jobTitle = descriptions[4];
    const temp = descriptions[5].split("·");
    const location = temp[0];
    return { company, jobTitle, location };
  }

  async cleanUp() {
    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
  }
}
