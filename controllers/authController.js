import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";
import AppError from "../utils/appError.js";

configDotenv();

let signToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "90d",
    });
};

async function register(req, res, next) {
    const username = req.body.username;
    const password = await bcrypt.hash(req.body.password, 12);
    let user;
    try {
        user = await User.create({ username, password });
    } catch (e) { // ! handle invalid username
        throw new Error(e.original.detail);
    } 
    const token = signToken(user.dataValues.user_id);
    res.cookie("token", token, { httpOnly: true });
    res.status(201).json({ status: "OK", message: "Signed up successfully." });
}
async function login(req, res, next) {
    const username = req.body.username;
    const password = req.body.password;
    let user;
    if (
        username !== process.env.ADMIN_USERNAME &&
        password !== process.env.ADMIN_PASSWORD
    ) {
        try {
            user = await User.findOne({
                where: { username },
            });
            const isPasswordMatch = await bcrypt.compare(
                password,
                user?.dataValues.password
            );
            if (!isPasswordMatch) throw new Error();
        } catch {
            return next(
                new AppError("username or password is incorrect.", 401)
            );
        }
    } else {
        user = await User.findOne({ where: { username, password } });
    }
    const token = signToken(user.dataValues.user_id);
    res.cookie("token", token, { httpOnly: true });
    res.status(200).json({
        status: "OK",
        message: "Logged in successfully.",
    });
}

async function routeProtector(req, res, next) {
    const token = req?.cookies.token;
    let payload;
    if (!token) {
        return next(new AppError("you're not signed in...", 401));
    }
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return next(new AppError("Invalid token!", 401));
    }
    const user = await User.findOne({ where: { user_id: payload.userId } });
    if (user === null) {
        return next(
            new AppError("no user with this token have been found!", 403)
        );
    }
    res.locals.user = user.dataValues;
    next();
}

async function authorizeRole(req, res, next) {
    const role = res.locals.user.role;
    if (role !== "admin") {
        return next(
            new AppError("you're not authorized to perform this action.", 403)
        );
    }
    next();
}

export { register, login, routeProtector, authorizeRole };
