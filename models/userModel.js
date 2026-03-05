const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
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
const User = mongoose.model("User", userSchema);
module.exports = User;
