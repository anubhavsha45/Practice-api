const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const appError = require("./../utils/appError");
const jwt = require("jsonwebtoken");
exports.signup = catchAsync(async (req, res, next) => {
  //GET THE USER DATA
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  //send the json web token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_SECRET_KEY_EXPIRES_IN,
  });
  //send the token as response
  res.status(201).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
});
exports.login = catchAsync(async (req, res, next) => {
  //get the email and password from body
  const { email, password } = req.body;
  //throw the error if there is no email or password given
  if (!email || !password) {
    return next(
      new appError(
        "Please give your details : Email and password both are required",
        400,
      ),
    );
  }
  //now check if the details entered are correct or not
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(
      new appError(
        "The details you entered are not valid! Please try again",
        400,
      ),
    );
  }
  //if the details are valid,create the json web token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_SECRET_KEY_EXPIRES_IN,
  });
  //send this as a response
  res.status(200).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
});
