import bcrypt from "bcrypt";
import jwt, { type JwtPayload, type Secret } from "jsonwebtoken";
import dotenv from "dotenv";
import AppError from "../utils/appError.ts";
import { PrismaClient } from "../prisma/generated/index.js";
import type { Request, Response, NextFunction } from "express";
const prisma = new PrismaClient();

dotenv.config({ path: "../.env" });

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in env file");
}

let signToken = (userId: number) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: "90d",
  });
};

async function register(req: Request, res: Response, next: NextFunction) {
  const username = req.body.username;
  const password = await bcrypt.hash(req.body.password, 12);
  let user;
  try {
    user = await prisma.user.create({
      data: { username, password, role: "admin" },
    });
  } catch (e: any) {
    throw new Error(e);
  }
  const token = signToken(user.user_id);
  res.cookie("token", token, { httpOnly: true });
  res.status(201).json({ status: "OK", message: "Signed up successfully." });
}
async function login(req: Request, res: Response, next: NextFunction) {
  // TODO should implement better way for admin auth handling
  const username = req.body.username;
  const password = req.body.password;
  let user;
  if (
    username !== process.env.ADMIN_USERNAME &&
    password !== process.env.ADMIN_PASSWORD
  ) {
    try {
      user = await prisma.user.findUnique({
        where: { username },
      });
      if (user === null) throw new AppError("Invalid username/password", 404);
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) throw new Error();
    } catch (e) {
      return next(e);
    }
  } else {
    user = await prisma.user.findUnique({ where: { username, password } });
  }
  const token = signToken(user!.user_id);
  res.cookie("token", token, { httpOnly: true });
  res.status(200).json({
    status: "OK",
    message: "Logged in successfully.",
  });
}

async function routeProtector(req: Request, res: Response, next: NextFunction) {
  const token = req?.cookies.token;
  let payload;
  if (!token) {
    return next(new AppError("authentication failed; sign in first.", 401));
  }
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return next(new AppError("Invalid token!", 401));
  }
  if (typeof payload === "string") {
    throw new Error("Invalid token payload format");
  }
  const user = await prisma.user.findUnique({
    where: { user_id: payload.userId },
  });
  if (user === null) {
    return next(new AppError("no user with this token have been found!", 403));
  }
  res.locals.user = user;
  next();
}

async function authorizeRole(req: Request, res: Response, next: NextFunction) {
  const role = res.locals.user.role;
  if (role !== "admin") {
    return next(
      new AppError("you're not authorized to perform this action.", 403)
    );
  }
  next();
}

export { register, login, routeProtector, authorizeRole };
