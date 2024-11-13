import { scraper } from "./src/scraper2/scraper.js";
import {
  validateJob,
  sendJob,
  createJob,
  existedJob,
  sendMessage,
  deleteJob,
  getJobs,
} from "./src/utils/util.js";

const msg = `
\n
Be sure to check these amazing repos as well
>>> [Summer2025-Internships](<https://github.com/SimplifyJobs/Summer2025-Internships/tree/dev>)
[Canadian-Tech-And-Business-Internships-Summer-2025](<https://github.com/IsaiahIruoha/Canadian-Tech-And-Business-Internships-Summer-2025>)
[Canadian-Tech-Internships-2025](<https://github.com/Dannny-Babs/Canadian-Tech-Internships-2025>)
Happy Job Hunt 🫡
\n
`;

const sess_discord_web_hook_url = process.env.SESS_WEB_HOOK_URL;
// only post <= 10 postings for sdg
const sdg_discord_web_hook_url = process.env.SDG_WEB_HOOK_URL;
let numJobSent = 0;

// Remove any dead jobs based on the TTL
let remove_jobs = await getJobs();
for (const job of remove_jobs) {
  const currentTime = Math.floor(Date.now() / 1000);
  if (job.timetolive < currentTime) {
    await deleteJob(job);
  }
}

// Start scraping
await scraper.setUp();
const jobs = await scraper.run();

for (const job of jobs) {
  console.log(job);
  if (
    !(await existedJob(job)) &&
    (await validateJob(job)) &&
    job.company != "myGwork - LGBTQ+ Business Community"
  ) {
    await createJob(job);
    // sent this posting to SESS
    await sendJob(job, (toWho = sess_discord_web_hook_url));
    if (jobSent <= 10) {
      // sent this posting to SDG
      await sendJob(job, (toWho = sdg_discord_web_hook_url));
      numJobSent += 1;
    }
    console.log(" --- New job added");
  }
}

await sendMessage(msg, toWho=sess_discord_web_hook_url);
await sendMessage(msg, toWho=sdg_discord_web_hook_url);

await scraper.cleanUp();
