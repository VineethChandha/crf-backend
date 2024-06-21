import Customer from "../models/Customer.js";
import Restaurant from "../models/Restaurant.js";
import RestaurantAdmin from "../models/RestaurantAdmin.js";
import mongoose from "mongoose";
import validator from "validator";
import RewardPoint from "../models/RewardPoints.js";

export const createRestaurant = async (req, res) => {
  try {
    const {
      restaurantName,
      address,
      llc,
      phoneNumber,
      email,
      ownerName,
      primaryContactDetails,
      agreementAccepted,
      isAccepted,
      isPending,
      isRejected,
      password,
    } = req.body;

    if (
      !restaurantName ||
      !address ||
      !llc ||
      !phoneNumber ||
      !email ||
      !ownerName ||
      !primaryContactDetails ||
      agreementAccepted === undefined ||
      !password
    ) {
      return res.status(400).json({ error: "All fields are required." });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    if (!validator.isEmail(primaryContactDetails.email)) {
      return res
        .status(400)
        .json({ error: "Invalid primary contact email format." });
    }

    if (!validator.isLength(phoneNumber, { min: 10, max: 10 })) {
      return res
        .status(400)
        .json({ error: "Phone number should be exactly 10 characters long." });
    }

    const existingRestaurant = await Restaurant.findOne({
      phoneNumber: phoneNumber,
    });
    const existingRestaurantEmail = await Restaurant.findOne({ email: email });

    if (existingRestaurant || existingRestaurantEmail) {
      return res
        .status(400)
        .json({ error: "Restaurant with this email or phone already exists!" });
    }

    const newRestaurant = await Restaurant.create({
      restaurantName,
      address,
      llc,
      phoneNumber,
      email,
      ownerName,
      primaryContactDetails,
      agreementAccepted,
      createdBy: req.userId,
      isAccepted: isAccepted || false,
      isPending: isPending || false,
      isRejected: isRejected || false,
      password: password,
    });
    return res.status(201).json({
      message: "Restaurant created successfully.",
      restaurant: newRestaurant,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getRestaurants = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      isAccepted,
      name,
    } = req.body;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    let queryObj = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      queryObj.createdAt = { $gte: start, $lte: end };
    }

    if (isAccepted) {
      queryObj.isAccepted = true;
    }

    if (name) {
      queryObj.restaurantName = new RegExp(name, "i");
    }

    const totalRestaurants = await Restaurant.countDocuments(queryObj);

    const restaurants = await Restaurant.find(queryObj)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "Fetched restaurants successfully",
      total: totalRestaurants,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalRestaurants / limitNum),
      data: restaurants,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    res.status(500).json({ error: "Server error." });
  }
};

export const deleteRestaurant = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    console.log(id);
    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found." });
    }

    await RestaurantAdmin.deleteMany({ restaurantId: id });
    await Customer.deleteMany({ restaurantId: id });
    await Restaurant.findByIdAndDelete(id);

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "Restaurant subscription revoked successfully",
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

export const getRestaurantCustomers = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { page = 1, limit = 10, restaurantId, phone } = req.body;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    let queryObj = {};

    if (restaurantId) {
      queryObj.restaurantId = restaurantId;
    }

    if (phone) {
      queryObj.phoneNumber = new RegExp(phone, "i");
    }

    const totalCustomers = await Customer.countDocuments(queryObj);
    const customers = await Customer.find(queryObj)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    // Fetch reward points for each customer
    const customersWithPoints = await Promise.all(
      customers.map(async (customer) => {
        const rewardPoints = await RewardPoint.aggregate([
          { $match: { customerId: mongoose.Types.ObjectId(customer._id) } },
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

        return {
          ...customer,
          totalPoints: availablePoints,
          totalAddedPoints,
          totalRedeemedPoints,
        };
      })
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "Fetched restaurant customers successfully",
      total: totalCustomers,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCustomers / limitNum),
      data: customersWithPoints,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error fetching restaurant customers:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const updateRestaurant = async (req, res) => {
  try {
    const { restaurantId, status } = req.body;
    console.log(restaurantId, status);
    let data = {};
    if (status === "accept") {
      data.isAccepted = true;
      data.isPending = false;
      data.isRejected = false;
    } else if (status === "pending") {
      data.isPending = true;
      data.isAccepted = false;
      data.isRejected = false;
    } else {
      data.isRejected = true;
      data.isAccepted = false;
      data.isPending = false;
    }
    const restaurant = await Restaurant.updateOne({ _id: restaurantId }, data);

    return res.status(200).json({
      message: "Restaurant status updated",
      restaurant,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getRestaurantData = async (req, res) => {
  try {
    const { id } = req.body;
    const restaurant = await Restaurant.findById(id).lean();
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    const rewardPoints = await RewardPoint.aggregate([
      { $match: { restaurantId: mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: "$type",
          totalPoints: { $sum: "$points" },
        },
      },
    ]);

    const totalPoints =
      rewardPoints.find((rp) => rp._id[0] === "add")?.totalPoints || 0;
    const redeemedPoints =
      rewardPoints.find((rp) => rp._id[0] === "redeem")?.totalPoints || 0;

    const restaurantData = {
      restaurantName: restaurant.restaurantName,
      address: restaurant.address,
      llc: restaurant.llc,
      phoneNumber: restaurant.phoneNumber,
      email: restaurant.email,
      ownerName: restaurant.ownerName,
      primaryContactDetails: restaurant.primaryContactDetails,
      totalPoints: totalPoints,
      redeemedPoints: redeemedPoints,
    };

    return res.status(200).json({
      message: "Restaurant Fetched",
      restaurantData,
    });
  } catch (error) {
    res.status(500).send({ message: err.message });
  }
};

export const editRestaurant = async (req, res) => {
  try {
    const {
      restaurantName,
      address,
      llc,
      phoneNumber,
      email,
      ownerName,
      primaryContactDetails,
      password,
    } = req.body;
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    if (restaurantName) restaurant.restaurantName = restaurantName;
    if (address) restaurant.address = address;
    if (llc) restaurant.llc = llc;
    if (phoneNumber) restaurant.phoneNumber = phoneNumber;
    if (email) restaurant.email = email;
    if (ownerName) restaurant.ownerName = ownerName;
    if (primaryContactDetails)
      restaurant.primaryContactDetails = primaryContactDetails;
    if (password) restaurant.password = password;

    await restaurant.save();

    res.status(200).json({
      message: "Edited successfully",
      restaurant,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
