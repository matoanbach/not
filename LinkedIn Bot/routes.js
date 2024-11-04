import express from "express";
import { create, getJobById, getAllJobs, delete_ } from "./src/database/db.js";

const router = express.Router();

// READ ALL Users
router.get("/jobs", async (req, res) => {
  const { success, data } = await getAllJobs();

  if (success) {
    return res.json({ success, data });
  }
  return res.status(500).json({ success: false, messsage: "Error" });
});

// Get User by ID
router.get("/job/:id", async (req, res) => {
  const { id } = req.params;
  const { success, data } = await getJobById(id);
  console.log(data);
  if (success) {
    return res.json({ success, data });
  }

  return res.status(500).json({ success: false, message: "Error" });
});

// Create User
router.post("/job", async (req, res) => {
  const { success, data } = await create(req.body);

  if (success) {
    return res.json({ success, data });
  }

  return res.status(500).json({ success: false, message: "Error" });
});

// Update User by ID
router.put("/job/:id", async (req, res) => {
  const user = req.body;
  const { id } = req.params;
  // user.id = parseInt(id)

  const { success, data } = await create(user);

  if (success) {
    return res.json({ success, data });
  }

  return res.status(500).json({ success: false, message: "Error" });
});

// Delete User by Id
router.delete("/user/:id", async (req, res) => {
  const { id } = req.params;
  const { success, data } = await delete_(id);
  if (success) {
    return res.json({ success, data });
  }
  return res.status(500).json({ success: false, message: "Error" });
});

export default router;
