import AppError from "../utils/appError.ts";
import { findMovie } from "./movieController.ts";
import { isDateValid } from "../utils/dateValid.js";
import { isTimeValid } from "../utils/timeValid.js";
import type { ShowTime } from "../prisma/generated/index.d.ts";
import { PrismaClient } from "../prisma/generated/index.js";
import type { Request, Response, NextFunction } from "express";
import { showTimeRemained } from "./reserveController.ts";
// ? find the way to handle data we give from req body, params, query
const prisma = new PrismaClient();

export async function retrieveShowTimes(
  req: Request,
  res: Response,
  next: NextFunction
) {
  let showTimes;
  const dateFilter = req.query?.date;
  if (dateFilter && typeof dateFilter !== "string") {
    throw new Error("Invalid date type");
  } else if (dateFilter) {
    await isDateValid(dateFilter);
    showTimes = await prisma.showTime.findMany({
      where: { date: dateFilter },
    });
  } else {
    // ? I think we're gonna need pagination
    showTimes = await prisma.showTime.findMany();
  }
  return res.status(200).json({
    showTimes,
  });
}

export async function findShowTime(showTime_id: number) {
  const showTime = await prisma.showTime.findUnique({
    where: { showTime_id },
  });
  if (showTime === null) {
    throw new AppError("can't find showTime with this id.", 404);
  }
  return showTime;
}

export async function retrieveShowTime(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const showTime_id = Number(req.params?.showTimeId);
    if (showTime_id) {
      const { showTime, remainedCapacity, remainedSeats } =
        await showTimeRemained(showTime_id);
      return res.status(200).json({
        capacity: showTime.capacity,
        remainedCapacity,
        date: showTime.date,
        duration: showTime.time,
        remainedSeats,
      });
    }
  } catch (err) {
    next(err);
  }
}
export async function addShowTime(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.body) {
      return next(new AppError("body is not provided", 400));
    }
    let movie_id = req.body.movie_id;
    let date = req.body.date; // YYYY/DD/MM
    let startTime = req.body.startTime; // [HH:MM]
    let endTime = req.body.endTime;
    let capacity = req.body.capacity;

    if (!movie_id || typeof movie_id !== "number") {
      return next(new AppError("movie_id is undefined or not a number", 400));
    }
    if (!capacity || typeof capacity !== "number") {
      return next(new AppError("capacity is undefined or not a number", 400));
    }
    await findMovie(movie_id);
    await isDateValid(date);
    await isTimeValid(startTime, endTime);
    await timeOverlap(date, startTime, endTime);

    if (capacity > 204) {
      throw `capacity could not be more than 204`;
    }
    await prisma.showTime.create({
      data: {
        movie_id,
        date,
        capacity,
        time: [startTime, endTime],
      },
    });

    res.status(200).json({
      status: "ok",
      msg: `show time added successfully`,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteShowTime(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.body) {
    return next(new AppError("body is not provided", 400));
  }
  const showTime_id = req.body.showTime_id;
  if (!showTime_id || typeof showTime_id !== "number") {
    return next(new AppError("movie_id is undefined or not a number", 400));
  }
  try {
    await prisma.userReserve.deleteMany({
      where: { showTime_id },
    });
  } catch {
    return next(new AppError("Invalid showtime id", 405));
  }
  res.status(200).json({
    status: "ok",
    msg: "show time deleted successfully.",
  });
}

export async function timeOverlap(
  date: string,
  startTime: string,
  endTime: string
) {
  const showTimes = await prisma.showTime.findMany({ where: { date } });
  if (!showTimes.length) return;
  showTimes.forEach((show: ShowTime) => {
    const [startHour, endHour] = [
      show.time[0]!.split(":")[0]!,
      show.time[1]!.split(":")[0]!,
    ];
    const [newStartHour, newEndHour] = [
      startTime.split(":")[0]!,
      endTime.split(":")[0]!,
    ];
    if (
      (newStartHour >= startHour && newStartHour <= endHour) ||
      (newEndHour >= startHour && newEndHour <= endHour)
    ) {
      throw new AppError("this time was reserved before.", 409);
    }
  });
}
