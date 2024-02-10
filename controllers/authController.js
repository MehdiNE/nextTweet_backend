import { User } from "../models/userModel.js";
import { catchAsync } from "../utils/catchAsync.js";
import jwt from "jsonwebtoken";
import { promisify } from "util";
import AppError from "../utils/appError.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail } from "../utils/email.js";

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
}

const createSendToken = (user, statusCode, message, res) => {
  const token = signToken(user._id);

  res.cookie("jwt", token, {
    expires: new Date(
      Date.now + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: true,
    httpOnly: true,
  });

  res.status(statusCode).json({
    status: "success",
    message,
    token,
    data: {
      user,
    },
  });
};

export const checkUserExist = catchAsync(async (req, res, next) => {
  const { phone, email, isEmail } = req.body;

  // 1) Check if email and phone exist
  const user = await User.findOne(isEmail ? { email } : { phone });

  if (user) {
    return next(
      new AppError(
        `${
          isEmail ? "Email" : "Phone number"
        } is taken!. Try with a different ${
          isEmail ? "Email" : "Phone number"
        }.`,
        400
      )
    );
  }

  res.status(200).json({
    status: "success",
  });
});

export const signup = catchAsync(async (req, res, next) => {
  const { password, confirmPassword, name, email } = req.body;

  // 1) Check if email and password exist
  if (!email || !password || !name || !confirmPassword) {
    return next(new AppError("Please provide email, password and name!", 400));
  }

  const user = await User.findOne({ email });

  if (user) {
    return next(
      new AppError("Email is taken!. Try with a different email.", 400)
    );
  }

  if (password !== confirmPassword) {
    return next(
      new AppError("Password and Confirm password should be the same!", 400)
    );
  }

  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });

  createSendToken(newUser, 201, "User created successfully", res);
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }

  // 2) Check if user exist && password is correct
  const user = await User.findOne({ email }).select("+password");

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!user || !isPasswordCorrect) {
    return next(new AppError("Incorrect email or password!", 401));
  }

  // 3) If everything of, send token to client
  createSendToken(user, 201, "User logged in successfully", res);
});

export const protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }
  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const freshUser = await User.findById(decoded.id);

  if (!freshUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }

  // 4)  Check if user changed password after the token was issued
  if (freshUser.changedPasswordAt) {
    const changedTimestamp = parseInt(
      freshUser.changedPasswordAt.getTime() / 1000,
      10
    );

    if (decoded.iat < changedTimestamp) {
      return next(
        new AppError(
          "User recently changed password! Please log in again.",
          401
        )
      );
    }
  }

  //GRANT ACCESS TO PROTECTED ROUTE
  req.user = freshUser;
  next();
});

export const forgotPassword = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Get user based on POSTed email
  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError("There is no user with email address.", 404));
  }

  // 2) Generate the random reset token
  const resetToken = crypto.randomBytes(32).toString("hex");

  await User.updateOne({
    passwordResetToken: crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex"),
    passwordResetExpires: Date.now() + 10 * 60 * 1000,
  });

  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nif you didn't forgot your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 minute)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (error) {
    await User.updateOne({
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    });

    return next(
      new AppError(
        "There was an error sending the email. Try again later!.",
        500
      )
    );
  }
});

export const resetPassword = catchAsync(async (req, res, next) => {
  const { password, confirmPassword } = req.body;

  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // 2) If token has not expired, and there is user set the new password

  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  if (password !== confirmPassword) {
    return next(
      new AppError("Password and Confirm password should be the same!", 400)
    );
  }

  user.password = password;
  user.confirmPassword = confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.changedPasswordAt = Date.now() - 1000;
  await user.save();

  // 3) Log the user in, send JWT
  createSendToken(user, 201, "User logged in successfully", res);
});

export const updatePassword = catchAsync(async (req, res, next) => {
  const { password, confirmPassword, newPassword } = req.body;

  // 1) Get user from collection
  const user = await User.findById(req.user.id).select("+password");

  // 2) Check if POSTed password is correct
  if (password !== confirmPassword) {
    return next(
      new AppError("Password and Confirm password should be the same!", 400)
    );
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!user || !isPasswordCorrect) {
    return next(new AppError("Your current password id wrong.", 401));
  }
  // 3) If so, update password
  user.password = newPassword;
  await user.save();

  // 4) Log user in, send JWT
  createSendToken(user, 201, "User logged in successfully", res);
});
