import express from "express";
import cookieParser from "cookie-parser";
import { PrismaClient } from "./prisma/generated/index.js";
import { authRouter } from "./routes/authRoute.ts";
import { moviesRouter } from "./routes/movieRoute.ts";
import { showTimeRouter } from "./routes/showTimeRoute.ts";
import { routeProtector } from "./controllers/authController.ts";
import { reserveRouter } from "./routes/reserveRoute.ts";

import AppError from "./utils/appError.ts";
import globalErrorHandler from "./controllers/errorController.ts";

export const prisma = new PrismaClient();
const app = express();
app.listen(3000, () => console.log("LISTENING: ", 3000));

app.use(cookieParser());
app.use(express.json());

app.use("/user/auth", authRouter);
app.use("/movies", moviesRouter);
app.use("/showTimes", showTimeRouter);
app.use("/reserve", routeProtector, reserveRouter);

app.use((req, res, next) =>
  next(new AppError(`can't find ${req.originalUrl} on this server!`, 404))
);
app.use(globalErrorHandler);
