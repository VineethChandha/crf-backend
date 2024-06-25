import ProductAdmin from "../models/ProductAdmin.js";
import Restaurant from "../models/Restaurant.js";
import validator from "validator";

export const createProductAdmin = async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;
    const productAdmin = await ProductAdmin.findOne({ email: email });

    if (productAdmin) {
      return res.status(501).json({
        success: true,
        message: "User Already Exists !",
      });
    } else {
      const user = await ProductAdmin.create({
        username,
        email,
        password,
        phone,
      });

      return res.status(201).json({
        success: true,
        message: "User Created Successfully !",
        data: user,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const validateProductAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body);
    const productAdmin = await ProductAdmin.findOne({ email: email });

    if (!productAdmin) {
      return res.status(501).json({
        success: true,
        message: "No user found",
      });
    } else {
      const isValidPassword = await productAdmin.isValidatedPassword(
        password,
        productAdmin.password
      );

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Invalid password",
        });
      }

      const token = productAdmin.getJwtToken();

      delete productAdmin.password;

      return res.status(200).json({
        success: true,
        message: "User validated successfully",
        token: token,
        productAdmin,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const validateRestaurantAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const restaurantAdmin = await Restaurant.findOne({ email: email });

    if (!restaurantAdmin) {
      return res.status(501).json({
        success: false,
        message: "No user found",
      });
    } else {
      if (!restaurantAdmin.isAccepted) {
        if (restaurantAdmin.isRejected) {
          return res.status(501).json({
            success: false,
            message: "Request Rejected",
          });
        } else {
          return res.status(501).json({
            success: false,
            message: "Request Pending",
          });
        }
      } else {
        const isValidPassword = await restaurantAdmin.isValidatedPassword(
          password,
          restaurantAdmin.password
        );

        if (!isValidPassword) {
          return res.status(401).json({
            success: false,
            message: "Invalid password",
          });
        }

        const token = restaurantAdmin.getJwtToken();

        delete restaurantAdmin.password;

        return res.status(200).json({
          success: true,
          message: "User validated successfully",
          token: token,
          restaurantAdmin,
        });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const test = async (req, res) => {
  return res.status(200).json({
    message: "Hello",
  });
};

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
      error: error,
    });
  }
};
