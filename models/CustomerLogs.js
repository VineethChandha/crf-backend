import mongoose from "mongoose";

const customerLogSchmea = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    action: {
      type: String,
      enum: ["signUp", "addPoints", "redeemPoints", "deleteProfile"],
      required: true,
    },
    details: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const CustomerLog = mongoose.model("CustomerLog", customerLogSchmea);
export default CustomerLog;
