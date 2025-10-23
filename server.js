import express from "express";
import { authRouter } from "./routes/authRoute.js";
import AppError from "./utils/appError.js";
import globalErrorHandler from "./controllers/errorController.js";
import { moviesRouter } from "./routes/movieRoute.js";
import cookieParser from "cookie-parser";
import { showTimeRouter } from "./routes/showTimeRoute.js";
import { routeProtector } from "./controllers/authController.js";
import { reserveRouter } from "./routes/reserveRoute.js";
import UserReservations from "./models/reserveModel.js";
import sequelize from "./sequelize_config.js";

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
