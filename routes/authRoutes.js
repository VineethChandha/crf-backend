import express from "express";
import {
  createProductAdmin,
  validateProductAdmin,
  validateRestaurantAdmin,
  createRestaurant,
} from "../controllers/authController.js";
const router = express.Router();

router.route("/createAdmin").post(createProductAdmin);
router.route("/validateAdmin").post(validateProductAdmin);
router.route("/validateRestaurantAdmin").post(validateRestaurantAdmin);
router.route("/external/addRestaurant").post(createRestaurant);

export default router;
