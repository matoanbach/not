// db.js

import { db, TABLE_NAME } from "./db.config.js";

const create = async (job) => {
  const params = {
    TableName: TABLE_NAME,
    Item: job,
  };
  try {
    await db.put(params);
    return { success: true };
  } catch (error) {
    console.error("Error creating item: ", error);
    return { success: false };
  }
};

const getJobById = async (value, key = "job_title_company_name") => {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      [key]: value,
    },
  };
  try {
    const { Item = null } = await db.get(params);
    return { success: true, data: Item };
  } catch (error) {
    console.error("Error getting item: ", error);
    return { success: false, data: null };
  }
};

const getAllJobs = async () => {
  const params = {
    TableName: TABLE_NAME,
  };
  try {
    const { Items = [] } = await db.scan(params);
    return { success: true, data: Items };
  } catch (error) {
    console.error("Error scanning table: ", error);
    return { success: false, data: null };
  }
};

const delete_ = async (value, key = "job_title_company_name") => {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      [key]: value,
    },
  };
  try {
    await db.delete(params);
    return { success: true };
  } catch (error) {
    console.error("Error deleting item: ", error);
    return { success: false };
  }
};

export { create, getJobById, getAllJobs, delete_ };
