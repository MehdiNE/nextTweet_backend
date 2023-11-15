import express from "express";
import {
  createTweet,
  deleteTweet,
  getAllTweet,
  getTweet,
} from "../controllers/tweetController.js";

const router = express.Router();

router.route("/").get(getAllTweet).post(createTweet);
router.route("/:id").get(getTweet).delete(deleteTweet);

export default router;
