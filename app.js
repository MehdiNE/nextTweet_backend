import express from "express";
import tweetRouter from "./routes/tweetRoutes.js";
import userRouter from "./routes/userRoutes.js";
import AppError from "./utils/appError.js";
import { errorController } from "./controllers/errorController.js";

export const app = express();

app.use(express.json());

app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/users", userRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorController);
