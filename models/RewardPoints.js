import mongoose from "mongoose";

const rewardPointSchema = new mongoose.Schema(
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
    points: {
      type: Number,
      required: true,
    },
    type: {
      type: [
        {
          type: String,
          enum: ["add", "redeem"],
        },
      ],
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

const RewardPoint = mongoose.model("RewardPoint", rewardPointSchema);
export default RewardPoint;
