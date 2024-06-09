import mongoose from "mongoose";

const notificationsSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    type: {
      type: [
        {
          type: String,
          enum: ["signUp", "pointsUpdate", "profileDeleted", "promotional"],
        },
      ],
      required: true,
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      validate: [validator.isEmail, "Please enter email in correct format"],
      unique: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Notifications = mongoose.model("Notifications", notificationsSchema);
export default Notifications;
