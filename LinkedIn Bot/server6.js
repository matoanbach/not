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



// const jobs = [
//   {
//     jobTitle: "Embedded Software Developer Co-op (4-16 months, January 2025)",
//     company: "Ciena",
//     location: "Ottawa, ON",
//   },
//   {
//     jobTitle: "Software Engineering Intern",
//     company: "Ada",
//     location: "Canada",
//   },
//   {
//     jobTitle: "WaveLogic Software Intern (Winter 2025)",
//     company: "Ciena",
//     location: "Ottawa, ON",
//   },
//   {
//     jobTitle: "Engineering Software Development Intern (Winter 2025)",
//     company: "Ciena",
//     location: "Ottawa, ON",
//   },
//   {
//     jobTitle: "WaveLogic Software Intern (January 2025)",
//     company: "Ciena",
//     location: "Ottawa, ON",
//   },
//   {
//     jobTitle: "Photonic Card Software Developer - New Grad 2025",
//     company: "Ciena",
//     location: "Ottawa, ON",
//   },
//   {
//     jobTitle: "Software Engineer - Co-Op/PEY",
//     company: "Seismic",
//     location: "Toronto, ON",
//   },
//   {
//     jobTitle: "AI Engineer and Research Co-op for Cyber Security - Winter 2025",
//     company: "Siemens",
//     location: "Ottawa, ON",
//   },
//   {
//     jobTitle: "Software Test Engineer Co-op (8-12 months - January 2025)",
//     company: "Ciena",
//     location: "Ottawa, ON",
//   },
//   {
//     jobTitle: "RLS Photonics Software Engineer - New Grad 2025",
//     company: "Ciena",
//     location: "Ottawa, ON",
//   },
//   {
//     jobTitle: "Intern, Full Stack Developer",
//     company: "Bosa Properties",
//     location: "Vancouver, BC",
//   },
// ];
