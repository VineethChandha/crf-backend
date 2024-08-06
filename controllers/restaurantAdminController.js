import validator from "validator";
import Customer from "../models/Customer.js";
import RewardPoint from "../models/RewardPoints.js";
import CustomerLog from "../models/CustomerLogs.js";
import mongoose from "mongoose";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  secure: true,
  port: 465,
});

export const addCustomer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      restaurantId,
      email,
      firstName,
      lastName,
      gender,
      dob,
      phoneNumber,
      address,
      city,
      state,
      zipCode,
      agreePromotionalEmails,
      agreeDataSharing,
    } = req.body;

    if (
      !restaurantId ||
      !email ||
      !firstName ||
      !lastName ||
      !gender ||
      !dob ||
      !phoneNumber ||
      !address ||
      !city ||
      !state ||
      !zipCode
    ) {
      return res.status(400).json({ error: "All fields are required." });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    const exisitngCusEmail = await Customer.findOne({
      email: email,
      restaurantId: restaurantId,
    });

    const exisitngCusPhone = await Customer.findOne({
      phoneNumber: phoneNumber,
      restaurantId: restaurantId,
    });

    if (exisitngCusEmail || exisitngCusPhone) {
      return res
        .status(400)
        .json({ error: "Customer with this email or phone already exists!" });
    }

    const customer = await Customer.create({
      restaurantId,
      email,
      firstName,
      lastName,
      gender,
      dob,
      phoneNumber,
      address,
      city,
      state,
      zipCode,
      agreePromotionalEmails,
      agreeDataSharing,
    });

    await CustomerLog.create({
      customerId: customer._id,
      restaurantId,
      action: "signUp",
      details: "Signed up the user",
    });

    await session.commitTransaction();
    session.endSession();
    return res.status(200).json({
      message: "Added customer successfully",
      customer: customer,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const addReward = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { customerId, restaurantId, points, type, email } = req.body;
    if (!customerId || !restaurantId || !points || !type) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const totalPoints = await RewardPoint.aggregate([
      { $match: { customerId: mongoose.Types.ObjectId(customerId) } },
      { $group: { _id: "$customerId", totalPoints: { $sum: "$points" } } },
    ]);

    const currentPoints =
      totalPoints.length > 0 ? totalPoints[0].totalPoints : 0;

    if (type === "redeem" && currentPoints < points) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ error: "Not enough reward points to redeem." });
    }

    const reward = await RewardPoint.create(
      [
        {
          customerId,
          restaurantId,
          points: type === "add" ? points : -points,
          type,
        },
      ],
      { session }
    );

    await CustomerLog.create(
      [
        {
          customerId,
          restaurantId,
          action: type === "add" ? "addPoints" : "redeemPoints",
          details: type === "add" ? "Added reward points" : "Redeemed points",
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    console.log(email);
    const subject = type === "add" ? "Rewards Added" : "Rewards Redeemed";
    const text =
      type === "add"
        ? `${points} reward points are credited to your account.Total available reward points are: ${
            Number(currentPoints) + Number(points)
          }.`
        : `${points} reward points are redeemed from your account.Total available reward points are: ${
            Number(currentPoints) - Number(points)
          }.`;
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: subject,
      text: text,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        res.status(500).send("Error sending email");
      } else {
        console.log("Email sent: " + info.response);
        res.send("Email sent successfully");
      }
    });

    return res.status(200).json({
      message:
        type === "add"
          ? "Reward points are credited to your account"
          : "Reward points are redeemed from your account",
      reward: reward,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getCustomerProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id).lean();

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const rewardPoints = await RewardPoint.aggregate([
      { $match: { customerId: mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: "$type",
          totalPoints: { $sum: "$points" },
        },
      },
    ]);

    const totalAddedPoints =
      rewardPoints.find((rp) => rp._id[0] === "add")?.totalPoints || 0;
    const totalRedeemedPoints =
      rewardPoints.find((rp) => rp._id[0] === "redeem")?.totalPoints || 0;
    const availablePoints = totalAddedPoints + totalRedeemedPoints;

    return res.status(200).json({
      message: "Fetched customer data successfully",
      customer: {
        ...customer,
        totalPoints: availablePoints,
        totalAddedPoints,
        totalRedeemedPoints,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// removing customer from the reward system
export const deleteCustomer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    await RewardPoint.deleteMany({ customerId: id });

    await Customer.deleteOne({ _id: id });
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "User removed from the reward program",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getCustomerLogs = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.body;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const totalLogs = await CustomerLog.countDocuments({ customerId: id });

    const logs = await CustomerLog.find({ customerId: id })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "Fetched logs successfully",
      total: totalLogs,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalLogs / limitNum),
      data: logs,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getRewardPoints = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { page = 1, limit = 10, id } = req.body;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const totalRewards = await RewardPoint.countDocuments({ customerId: id });

    const rewards = await RewardPoint.find({ customerId: id })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: "desc" });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "Rewards fetched successfully",
      total: totalRewards,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalRewards / limitNum),
      data: rewards,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const editCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      gender,
      dob,
      phoneNumber,
      email,
      address,
      city,
      state,
      zipCode,
    } = req.body;

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (firstName) customer.firstName = firstName;
    if (lastName) customer.lastName = lastName;
    if (gender) customer.gender = gender;
    if (dob) customer.dob = dob;
    if (phoneNumber) customer.phoneNumber = phoneNumber;
    if (email) customer.email = email;
    if (address) customer.address = address;
    if (city) customer.city = city;
    if (state) customer.state = state;
    if (zipCode) customer.zipCode = zipCode;

    await customer.save();

    return res.status(200).json({
      message: "Edit customer successfully",
      customer,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
