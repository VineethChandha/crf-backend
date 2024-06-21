import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const restaurantAdminSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      validate: [validator.isEmail, "Please enter email in correct format"],
      unique: true,
    },
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: [6, "Password should be of atleast 6 characters."],
      // select:false  // so that password will not go with model , we don't have to do user.password=undefined
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      validate: [validator.isEmail, "Please enter email in correct format"],
      unique: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,
  },
  {
    timestamps: true,
  }
);

// encrypt password before save
restaurantAdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

// validate the password with passed on user password
restaurantAdminSchema.methods.isValidatedPassword = async function (
  usersendPassword,
  password
) {
  return await bcrypt.compare(usersendPassword, password);
};

// create and return jwt token
restaurantAdminSchema.methods.getJwtToken = function () {
  return jwt.sign(
    { id: this._id, role: "restaurantAdmin" },
    process.env.JWT_SECRET,
    {
      expiresIn: "9h",
    }
  );
};

// generate forget password token (string)
restaurantAdminSchema.methods.getForgotPasswordToken = function () {
  // generate a long and random string
  const forgotToken = crypto.randomBytes(20).toString("hex");

  // getting a hash - make sure to get a hash on backend
  this.forgotPasswordToken = crypto
    .createHash("sha256")
    .update(forgotToken)
    .digest("hex");

  // time of token
  this.forgotPasswordExpiry = Date.now() + 20 * 60 * 1000; // 20 mins to expire password reset token

  return forgotToken;
};

const RestaurantAdmin = mongoose.model(
  "RestaurantAdmin",
  restaurantAdminSchema
);
export default RestaurantAdmin;
