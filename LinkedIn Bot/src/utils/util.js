import * as dotenv from "dotenv";
dotenv.config();
import fetch from "node-fetch";
import { create, getJobById, getAllJobs, delete_ } from "../database/db.js";
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY });
const TTL_DELTA = 60 * 60 * 24 * 14  //  14 DAY

const prompt = (jobTitle, company) => `
    You are an assistant that categorizes job roles. I will provide a job title and company name, and you need to determine if the job role is related to Computer Science (CS) Internship/Coop and is in the English language. If the job is related to CS (e.g., software engineering, data science, AI, networking) and is in English, respond with the following JSON format:

    { "isCSJob": true }

    If it's not related to CS or is not in English, respond with:

    { "isCSJob": false }

    Here is the role:
    Job Title: ${jobTitle}
    Company: ${company}

    Respond in JSON format.
  `;

// ask chatgpt if this job is valid
const validateJob = async (job) => {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "Swe internship categorization" },
      {
        role: "user",
        content: prompt(job.jobTitle, job.company),
      },
    ],
    response_format: {
      type: "json_object",
    },
  });

  const response = JSON.parse(completion.choices[0].message.content.trim());
  return response.isCSJob;
};

const sendJob = async (job) => {
  const message = {
    content: `
    >>>  💼 **Job Title**: ${job.jobTitle}
🏢 **Company**: ${job.company}
📍 **Location**: ${job.location}
🔗 [Apply Here](<${job.urlString}>)`,
  };

  // Loop to retry sending a message if we hit the rate limit
  while (true) {
    const response = await fetch(process.env.WEB_HOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (response.ok) {
      console.log("Message sent successfully using Webhook!");
      break;
    } else if (response.status === 429) {
      // Handle rate limit error
      const retryAfterMs = (await response.json()).retry_after * 1000;
      console.log(`Rate limit hit, retrying after ${retryAfterMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
    } else {
      console.error(`Error: Failed to send message: ${response.statusText}`);
      break;
    }
  }
};

const sendMessage = async (msg) => {
  const message = { content: msg };
  const response = await fetch(process.env.WEB_HOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
  if (response.ok) {
    console.log("Message sent successfully using Webhook!");
  } else {
    console.error(`Error: Failed to send message: ${response.statusText}`);
  }
};

const createJob = async (job) => {
  job.job_title_company_name = `${job.jobTitle}#${job.company}`;
  const currentTime = getCurrentTime();
  job.timetolive = currentTime + TTL_DELTA;
  console.log(job.timetolive);
  await create(job);
};

const getCurrentTime = () => Math.floor(Date.now() / 1000); //epoch time in seconds

const existedJob = async (job) => {
  const partition_key = `${job.jobTitle}#${job.company}`;
  const { success, data } = await getJobById(partition_key);
  const currentTime = getCurrentTime();

  return data != null && data.timetolive > currentTime;
};

const deleteJob = async (job) => {
  const job_title_company_name = `${job.jobTitle}#${job.company}`;
  await delete_(job_title_company_name);
};

const getJobs = async () => {
  let res = await getAllJobs();
  return res.data;
};

export {
  validateJob,
  sendJob,
  createJob,
  existedJob,
  sendMessage,
  deleteJob,
  getJobs,
};
