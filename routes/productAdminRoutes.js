import express from "express";
const router = express.Router();
import {
  createRestaurant,
  deleteRestaurant,
  editRestaurant,
  updateRestaurant,
} from "../controllers/productAdminController.js";

router.route("/addRestaurant").post(createRestaurant);
router.route("/deleteRestaurant/:id").delete(deleteRestaurant);
router.route("/updateRestaurant").post(updateRestaurant);
router.route("/editRestaurant/:id").put(editRestaurant);

export default router;
