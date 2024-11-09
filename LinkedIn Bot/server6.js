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
Be sure to check these amazing repos as well:\n
>>> [Summer2025-Internships](<https://github.com/SimplifyJobs/Summer2025-Internships/tree/dev>)
[Canadian-Tech-And-Business-Internships-Summer-2025](<https://github.com/IsaiahIruoha/Canadian-Tech-And-Business-Internships-Summer-2025>)
[Canadian-Tech-Internships-2025](<https://github.com/Dannny-Babs/Canadian-Tech-Internships-2025>)
Happy Job Hunt 🫡
`;

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
  if (!(await existedJob(job)) && (await validateJob(job))) {
    await createJob(job);
    await sendJob(job);
    console.log(" --- New job added");
  }
}
await sendMessage(msg);

await scraper.cleanUp();


