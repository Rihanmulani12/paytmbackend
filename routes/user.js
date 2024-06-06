const { Router } = require("express");
const { z } = require("zod");
const { User, Account } = require("../db");
const jwt = require("jsonwebtoken");

const { authMiddleware } = require("../middleware");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET// Import JWT_SECRET from environment variables

const router = Router();

const signUpBody = z.object({
  username: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  password: z.string().min(6),
});

const signInBody = z.object({
  username: z.string().email(),
  password: z.string(),
});

const updateBody = z.object({
  password: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

// Sign up route
router.post("/signup", async (req, res) => {
  try {
    const { success, data } = signUpBody.safeParse(req.body);
    if (!success) {
      return res.status(400).json({
        message: "Incorrect inputs!",
      });
    }

    const existingUser = await User.findOne({ username: data.username });
    if (existingUser) {
      return res.status(409).json({
        message: "User already exists!",
      });
    }

    const newUser = await User.create({
      username: data.username,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    const userId = newUser._id;
    await Account.create({
      userId: userId,
      balance: 1 + Math.random() * 10000,
    });

    const token = jwt.sign({ userId }, JWT_SECRET);
    return res.status(201).json({
      message: "User created successfully!",
      token: token,
    });
  } catch (error) {
    console.error("Error during signup:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Sign in route
router.post("/signin", async (req, res) => {
  try {
    const { success, data } = signInBody.safeParse(req.body);
    if (!success) {
      return res.status(400).json({
        message: "Incorrect format of email/password",
      });
    }

    const user = await User.findOne({
      username: data.username,
      password: data.password,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const userId = user._id;
    const token = jwt.sign({ userId }, JWT_SECRET);
    return res.status(200).json({ token: token });
  } catch (error) {
    console.error("Error during signin:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// User update route
router.put("/", authMiddleware, async (req, res) => {
  try {
    const { success, data } = updateBody.safeParse(req.body);
    if (!success) {
      return res.status(400).json({ message: "Incorrect inputs!" });
    }

    const userId = req.userId;
    const updatedUser = await User.findByIdAndUpdate(userId, data, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found!" });
    }

    return res.status(200).json({ message: "User details updated successfully!" });
  } catch (error) {
    console.error("Error during user update:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get all users route
router.get("/bulk", async (req, res) => {
  try {
    const filter = req.query.filter || "";
    const users = await User.find({
      $or: [
        { firstName: { $regex: new RegExp(filter, "i") } },
        { lastName: { $regex: new RegExp(filter, "i") } },
      ],
    });

    const usersWithoutPassword = users.map((user) => ({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      _id: user._id,
    }));

    return res.status(200).json({ users: usersWithoutPassword });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
