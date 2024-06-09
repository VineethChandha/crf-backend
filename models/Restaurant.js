import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const primaryContactDetailsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      validate: [validator.isEmail, "Please enter email in correct format"],
    },
  },
  { _id: false }
);

const restaurantSchema = new mongoose.Schema({
  restaurantName: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: [true, "Please provide an address"],
  },
  llc: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    minlength: [10, "Phone number should be of atleast 10 characters."],
    maxlength: [10, "Phone number should be of atmost 10 characters."],
  },
  email: {
    type: String,
    required: [true, "Please provide an email"],
    validate: [validator.isEmail, "Please enter email in correct format"],
    unique: true,
  },
  ownerName: {
    type: String,
    required: true,
  },
  primaryContactDetails: {
    type: primaryContactDetailsSchema,
    required: true,
  },
  isAccepted: {
    type: Boolean,
  },
  isRejected: {
    type: Boolean,
  },
  isPending: {
    type: Boolean,
  },
  agreementAccepted: {
    type: Boolean,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductAdmin",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  password: {
    type: String,
    default: Math.random().toString(),
  },
});

restaurantSchema.pre("save", async function (next) {
  this.updatedAt = Date.now();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// validate the password with passed on user password
restaurantSchema.methods.isValidatedPassword = async function (
  usersendPassword,
  password
) {
  return await bcrypt.compare(usersendPassword, password);
};

// create and return jwt token
restaurantSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "9h",
  });
};

const Restaurant = mongoose.model("Restaurant", restaurantSchema);
export default Restaurant;
