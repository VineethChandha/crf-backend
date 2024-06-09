import express from "express";
const router = express.Router();
import {
  createRestaurant,
  deleteRestaurant,
  downloadCustomerData,
  downloadRestaurant,
  editRestaurant,
  getRestaurantData,
  getRestaurants,
  updateRestaurant,
} from "../controllers/productAdminController.js";

router.route("/addRestaurant").post(createRestaurant);
router.route("/getRestaurants").post(getRestaurants);
router.route("/downloadCustomers/:id").post(downloadCustomerData);
router.route("/deleteRestaurant/:id").delete(deleteRestaurant);
router.route("/getRestaurant").post(getRestaurantData);
router.route("/downloadRestaurant/:id").get(downloadRestaurant);
router.route("/updateRestaurant").post(updateRestaurant);
router.route("/editRestaurant/:id").put(editRestaurant);

export default router;
