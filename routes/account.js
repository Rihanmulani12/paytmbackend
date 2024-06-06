const { Router } = require("express");
const { authMiddleware } = require("../middleware");
const { Account } = require("../db.js");
const { z } = require("zod");
const mongoose = require("mongoose");

const router = Router();

const transferBody = z.object({
  to: z.string(),
  amount: z.number().positive(),
});

// Endpoint to get balance for user
router.get("/balance", authMiddleware, async (req, res) => {
  try {
    const account = await Account.findOne({ userId: req.userId });
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }
    return res.status(200).json({ balance: account.balance });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Endpoint for money transfer from account to another account
router.post("/transfer", authMiddleware, async (req, res) => {
  const { success, error } = transferBody.safeParse(req.body);
  if (!success) {
    return res.status(400).json({ message: "Invalid input: " + error });
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    const account = await Account.findOne({ userId: req.userId }).session(session);
    if (!account || account.balance < req.body.amount) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const toAccount = await Account.findOne({ userId: req.body.to }).session(session);
    if (!toAccount) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Recipient account not found" });
    }

    await Account.updateOne(
      { userId: req.userId },
      { $inc: { balance: -req.body.amount } }
    ).session(session);
    await Account.updateOne(
      { userId: req.body.to },
      { $inc: { balance: req.body.amount } }
    ).session(session);

    await session.commitTransaction();
    return res.status(200).json({ message: "Transfer successful" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
