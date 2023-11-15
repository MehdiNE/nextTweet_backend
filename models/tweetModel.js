import mongoose from "mongoose";

const tweetSchema = new mongoose.Schema({
  createdAt: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  source: {
    type: String,
    required: true,
  },
  in_reply_to_status_id: {
    type: String,
  },
  in_reply_to_user_id: {
    type: String,
  },
  in_reply_to_screen_name: {
    type: String,
  },
  quoted_status_id: {
    type: String,
  },
  quoted_status: {
    type: [this],
  },
  retweeted_status: {
    type: [this],
  },
  quoteCount: {
    type: Number,
    default: 0,
  },
  replyCount: {
    type: Number,
    default: 0,
  },
  retweetCount: {
    type: Number,
    default: 0,
  },
  favoriteCount: {
    type: Number,
    default: 0,
  },
  favorited: {
    type: Boolean,
  },
  retweeted: {
    type: Boolean,
  },
  isSensitive: {
    type: Boolean,
  },
  entities: {
    hashtags: { type: [String] },
  },
});

export const Tweet = mongoose.model("Tweet", tweetSchema);
