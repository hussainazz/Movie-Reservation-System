import type { Request, Response, NextFunction } from "express";
import type AppError from "../utils/appError.js";

export default function globalErrorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || "fail";

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
}
