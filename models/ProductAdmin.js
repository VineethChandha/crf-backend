import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const productAdminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      maxlength: [40, "Name should be under 40 characters."],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      validate: [validator.isEmail, "Please enter email in correct format"],
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: [6, "Password should be of atleast 6 characters."],
      // select:false  // so that password will not go with model , we don't have to do user.password=undefined
    },
    phone: {
      type: String,
      required: true,
      minlength: [10, "Phone number should be of atleast 10 characters."],
      maxlength: [10, "Phone number should be of at max 10 characters."],
    },
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,
  },
  {
    timestamps: true,
  }
);

// encrypt password before save
productAdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

// validate the password with passed on user password
productAdminSchema.methods.isValidatedPassword = async function (
  usersendPassword,
  password
) {
  return await bcrypt.compare(usersendPassword, password);
};

// create and return jwt token
productAdminSchema.methods.getJwtToken = function () {
  return jwt.sign(
    { id: this._id, role: "productAdmin" },
    process.env.JWT_SECRET,
    {
      expiresIn: "9h",
    }
  );
};

// generate forget password token (string)
productAdminSchema.methods.getForgotPasswordToken = function () {
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

const ProductAdmin = mongoose.model("User", productAdminSchema);
export default ProductAdmin;
