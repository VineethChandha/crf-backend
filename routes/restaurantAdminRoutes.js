import express from "express";
import {
  addCustomer,
  addReward,
  deleteCustomer,
  getCustomerProfile,
  editCustomer,
} from "../controllers/restaurantAdminController.js";
const router = express.Router();

router.route("/addCustomer").post(addCustomer);
router.route("/addReward").post(addReward);
router.route("/deleteCustomer/:id").delete(deleteCustomer);
router.route("/getCustomer/:id").get(getCustomerProfile);
router.route("/editCustomer/:id").put(editCustomer);

export default router;
