import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    required: [true, "Email is required."],
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  password: {
    type: String,
    required: [true, "Password is required."],
    select: false,
  },
  userName: {
    type: String,
  },
  location: {
    type: String,
  },
  url: {
    type: String,
  },
  description: {
    type: String,
  },
  protected: {
    type: Boolean,
  },
  verified: {
    type: Boolean,
  },
  followersCount: {
    type: Number,
  },
  friendsCount: {
    type: Number,
  },
  listedCount: {
    type: Number,
  },
  statusesCount: {
    type: Number,
  },
  createdAt: {
    type: String,
  },
  createdAt: {
    type: String,
  },
  profileBannerUrl: {
    type: String,
  },
  profileImage: {
    type: String,
  },
  changedPasswordAt: {
    type: String,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

export const User = mongoose.model("User", userSchema);
