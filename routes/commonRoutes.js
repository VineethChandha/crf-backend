import express from "express";
import { getRestaurantCustomers } from "../controllers/productAdminController.js";
import { getRewardPoints } from "../controllers/restaurantAdminController.js";
import {
  getRestaurantData,
  getRestaurants,
} from "../controllers/productAdminController.js";
const router = express.Router();

router.route("/getCustomers").post(getRestaurantCustomers);
router.route("/getRewardPoints").post(getRewardPoints);
router.route("/getRestaurant").post(getRestaurantData);
router.route("/getRestaurants").post(getRestaurants);

export default router;
