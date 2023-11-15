import { Tweet } from "../models/tweetModel.js";
import { catchAsync } from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";

export const getAllTweet = catchAsync(async (req, res, next) => {
  const tweets = await Tweet.find();

  res.status(200).json({
    status: "success",
    total: tweets?.length,
    data: {
      tweet: tweets,
    },
  });
});

export const createTweet = catchAsync(async (req, res, next) => {
  const newTweet = await Tweet.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      tweet: newTweet,
    },
  });
});

export const getTweet = catchAsync(async (req, res, next) => {
  const tweet = await Tweet.findById(req.params.id);

  if (!tweet) {
    return next(new AppError("Tweet is not available!", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      tweet: tweet,
    },
  });
});

export const deleteTweet = catchAsync(async (req, res, next) => {
  const tweet = await Tweet.findByIdAndDelete(req.params.id);

  if (!tweet) {
    return next(new AppError("Tweet is not available!", 404));
  }

  res.status(204).json({
    status: "success",
    message: "Tweet deleted successfully",
    data: {
      tweet: null,
    },
  });
});
