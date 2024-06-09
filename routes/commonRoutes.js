import express from "express";
import { getRestaurantCustomers } from "../controllers/productAdminController.js";
import { getRewardPoints } from "../controllers/restaurantAdminController.js";
const router = express.Router();

router.route("/getCustomers").post(getRestaurantCustomers);
router.route("/getRewardPoints").post(getRewardPoints);

export default router;
