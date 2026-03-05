const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your name"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Please enter your email"],
    lowercase: true,
    unique: true,
    trim: true,
    validate: [validator.isEmail, "Give the correct email"],
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please enter your password again to confirm it"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Password and Password confirm fields do not match",
    },
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: user,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});
//SECURING THE PASSWORD IN DATABASE
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  //hash the password
  this.password = await bcrypt.hash(this.password, 12);

  //delete the password confirm
  this.passwordConfirm = undefined;

  return;
});
//COMPARING THE ENCYRPTED PASSWORD
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
userSchema.methods.changedPassword = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};
userSchema.methods.createResetPasswordToken = function () {
  //CREATE THE REESET TOKEN
  const resetToken = crypto.randomBytes(32).toString("hex");

  //hash it
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  //passresetokenexpires
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};
const User = mongoose.model("User", userSchema);
module.exports = User;
