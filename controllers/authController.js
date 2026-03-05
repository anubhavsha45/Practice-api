const { promisify } = require("util");
const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const appError = require("./../utils/appError");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("./../utils/email");
const signToken = (id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_SECRET_KEY_EXPIRES_IN,
  });
  return token;
};
const createSendToken = (user, res, statusCode) => {
  const token = signToken(user._id);
  const cookieOption = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOption.secure = true;
  res.cookie("jwt", token, cookieOption);

  user.password = undefined;
  return res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  //GET THE USER DATA
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  //send the json web token
  createSendToken(user, res, 200);
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
  createSendToken(user, res, 200);
});
exports.protect = catchAsync(async (req, res, next) => {
  //WE NEED TO CHECK WHETHER USER HAS LOGGED AND FOR THAT WE NEED TO MAKE SURE THAT THERE IS A TOKEN IN AUTHORIATION IN HEADRS
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.Authorization.split(" ")[1];
  }
  //THROW THE ERROR IF THERE IS NOT EVEN A TOKEN
  if (!token) {
    return next(
      new appError(
        "You are not logged in to do this operation!Please log in to continue",
        401,
      ),
    );
  }
  //VERIFY THE TOKEN
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //CHECK WHETHER USER STILL EXISTS
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new appError(
        "The user belonging to this token does no longer exists",
        400,
      ),
    );
  }
  //check if the suer has changed password
  if (currentUser.changedPassword(decoded.iat)) {
    return next(
      new appError(
        "Recenly yout password has changed! please login agian",
        401,
      ),
    );
  }

  req.user = currentUser;

  next();
});
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles is an array
    if (!roles.includes(req.user.role)) {
      return next(
        new appError("You do not have permission to perform this action", 403),
      );
    }

    next();
  };
};
exports.forgotPassword = catchAsync(async (req, res, next) => {
  //GET THE USER BASED ON THE EMAIL HE SEND IN REQ.BODY
  const user = await User.findOne({ email: req.body.email });
  //SEND THE ERROR IF INVALID EMAIL
  if (!user) {
    return next(new appError("Invalid email address,try again", 401));
  }
  //CREATE THE RESET TOKEN
  const resetToken = user.createResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  //SEND THE EMAIL
  const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? send the patch request your new password and password confirm to : ${resetURL}.\nIf you did not forgot this message,please ignore this message`;
  try {
    await sendEmail({
      email: user.email,
      subject: "Password reset link",
      message,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return next(
      new appError(
        "There was some error sending the email,please try again",
        400,
      ),
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  //get the user based on token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new appError("Token is invalid or has expired", 401));
  }
  //ipdate the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();

  //create the jwt token
  createSendToken(user, res, 200);
});
exports.updatePassword = catchAsync(async (req, res, next) => {
  //get the user
  const user = await User.findOne(req.user.id).select("+password");

  //read the currentpassword
  const currentPassword = req.body.currentPassword;

  if (!user(!(await user.correctPassword(currentPassword, user.password)))) {
    return next(new appError("There is no user with that information", 401));
  }

  //update

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();

  createSendToken(user, res, 200);
});
