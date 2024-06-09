import express from "express";
import {
  addCustomer,
  addReward,
  deleteCustomer,
  getCustomerProfile,
  downloadCustomerData,
  downloadCustomerLogs,
  editCustomer,
} from "../controllers/restaurantAdminController.js";
const router = express.Router();

router.route("/addCustomer").post(addCustomer);
router.route("/addReward").post(addReward);
router.route("/deleteCustomer/:id").delete(deleteCustomer);
router.route("/getCustomer/:id").get(getCustomerProfile);
router.route("/downloadCustomer/:id").get(downloadCustomerData);
router.route("/downloadCustomerLogs/:id").get(downloadCustomerLogs);
router.route("/editCustomer/:id").put(editCustomer);

export default router;
