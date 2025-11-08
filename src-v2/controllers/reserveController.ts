import AppError from "../utils/appError.ts";
import { findShowTime } from "./showTimeController.ts";
import type { ShowTime, UserReserve } from "../prisma/generated/index.d.ts";
import { PrismaClient } from "../prisma/generated/index.js";
import type { Request, Response, NextFunction } from "express";
import { isDateValid } from "../utils/dateValid.js";
import SeatsJSON from "../seedTables/seats.json" with { type: "json" };

const prisma = new PrismaClient();

export async function showTimeRemained(showTimeId: number) {
  // ?
  let showTimeRemainedSeats: string[] = [];
  const showTime = await findShowTime(showTimeId);
  const showTimeReserves = await prisma.userReserve.findMany({
    where: { showTime_id: showTimeId },
  });
  const reservedSeats = showTimeReserves
    .map((user: UserReserve) => user.seat)
    .flat();
  const remainedCapacity = showTime.capacity - reservedSeats.length;
  if (remainedCapacity) {
    const showTimeAllSeats = SeatsJSON.slice(0, showTime.capacity - 1);
    showTimeRemainedSeats = showTimeAllSeats.filter((seat) => {
      return !reservedSeats.includes(seat);
    });
  }
  return { remainedSeats: showTimeRemainedSeats, remainedCapacity, showTime };
}

let checkSeatId = async (newSeats: string[], showTimeId: number) => {
  //?
  const showTime = await findShowTime(showTimeId);
  const seatsOfShow = SeatsJSON.slice(0, showTime.capacity);
  let seatsOfShow_set = new Set(seatsOfShow);
  let seatNotIncluded = newSeats.filter((seat) => !seatsOfShow_set.has(seat));
  if (seatNotIncluded.length > 0) {
    throw new AppError(
      `seat id is not acceptable for this show: ${seatNotIncluded}`,
      400
    );
  }
};

export async function isShowTimeOverdue(showTime: ShowTime) {
  try {
    await isDateValid(showTime.date);
  } catch {
    throw new AppError("schedule of showTime has been passed", 404);
  }
}

let findReserve = async (req: Request, res: Response, next: NextFunction) => {
  if (!res.locals.user.user_id) {
    throw new AppError("token is missing", 401);
  }
  if (!req.body) {
    throw new AppError("body is not provided", 400);
  }
  let showTime;
  let showTime_id;
  const user_id = Number(res.locals.user.user_id);
  showTime_id = req.body.showTime_id;
  if (!showTime_id || typeof showTime_id !== "number") {
    throw new AppError("movie_id is undefined or not a number", 400);
  }
  showTime = await findShowTime(Number(showTime_id));
  if (showTime === null)
    throw new AppError("no showTime with this id exists", 406);

  const userShowReserves = await prisma.userReserve.findUnique({
    where: {
      userPerShowReserves: {
        user_id,
        showTime_id,
      },
    },
  });
  return { user_id, userShowReserves, showTime_id, showTime };
};

export async function addReserve(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.body) {
    return next(new AppError("body is not provided", 400));
  }
  const addSeats: string[] = req.body.seats;
  const showTimeId = req.body.showTime_id;
  if (!showTimeId || typeof showTimeId !== "number") {
    throw new AppError("showtime_id is either undefined or not a number", 400);
  }
  if (!addSeats || addSeats.length === 0)
    throw new AppError("seat id must be provided", 400);
  try {
    await checkSeatId(addSeats, showTimeId);
    const { user_id, showTime_id, userShowReserves, showTime } =
      await findReserve(req, res, next);
    await findReserve(req, res, next);
    if (userShowReserves !== null) {
      throw new AppError(
        "reservation for this user-showtime is already created.",
        405
      );
    }
    await isShowTimeOverdue(showTime);
    const { remainedSeats, remainedCapacity } =
      await showTimeRemained(showTime_id);
    if (!remainedCapacity) throw new AppError("show is full", 405);
    await prisma.userReserve.create({
      data: {
        user_id,
        showTime_id,
        seat: addSeats,
      },
    });
    res.status(201).json({
      status: "ok",
      msg: "new reserve has been added successfully.",
    });
  } catch (err) {
    next(err);
  }
}
export async function updateReserveSeat(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let previousSeatReserve: string[] = [];
    let newSeats: string[] = [];
    if (!req.body.seats) {
      throw new AppError("newSeats filed is not declared", 404);
    } else {
      newSeats = req.body.seats.sort();
    }
    const showTimeId = req.body.showTime_id;
    if (!showTimeId || typeof showTimeId !== "number") {
      throw new AppError(
        "showTime id is either undefined or not a number",
        400
      );
    }
    if (newSeats.length !== 0) await checkSeatId(newSeats, showTimeId);
    const { user_id, showTime_id, userShowReserves, showTime } =
      (await findReserve(req, res, next)) || "";
    await isShowTimeOverdue(showTime);
    if (userShowReserves === null) {
      throw new AppError(
        "user does not have any reservation for this showtime.",
        405
      );
    }
    if (userShowReserves !== null)
      previousSeatReserve = userShowReserves.seat.sort();
    const { remainedSeats, remainedCapacity } =
      await showTimeRemained(showTimeId);
    if (!remainedCapacity && previousSeatReserve.length < newSeats.length) {
      throw new AppError("show is booked up. can't add new reserves.", 405);
    }
    let reserveIsChanged = (() => {
      if (previousSeatReserve.length === newSeats.length) {
        if (
          previousSeatReserve.every((value, index) => value === newSeats[index])
        )
          return false;
      }
      return true;
    })();
    if (reserveIsChanged) {
      let final_reserve: string[] = [];
      const removedSeats = previousSeatReserve.filter((id) => {
        return !newSeats.includes(id);
      });
      const addedSeats = newSeats
        .filter((id) => {
          return !previousSeatReserve.includes(id);
        })
        .sort();
      const remainedSeats_set = new Set(remainedSeats.sort());
      const notAvailableSeats = addedSeats.filter(
        (seat) => !remainedSeats_set.has(seat)
      );
      if (notAvailableSeats.length > 0)
        throw new AppError(`Seats not available: ${notAvailableSeats}`, 406);
      if (removedSeats.length !== 0) {
        final_reserve.push(
          ...previousSeatReserve.filter((id) => {
            return !removedSeats.includes(id);
          })
        );
      }
      if (addedSeats.length !== 0) {
        if (final_reserve.length !== 0) {
          final_reserve.push(...addedSeats);
        } else {
          final_reserve.concat(...previousSeatReserve.concat(...addedSeats));
        }
      }
      await prisma.userReserve.update({
        where: {
          userPerShowReserves: {
            user_id,
            showTime_id,
          },
        },
        data: {
          seat: final_reserve,
        },
      });
    }
    res.status(200).json({
      status: "ok",
      msg: "updated successfully",
    });
  } catch (err) {
    next(err);
  }
}
export async function removeReserve(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { user_id, showTime_id, userShowReserves, showTime } =
      await findReserve(req, res, next);
    await isShowTimeOverdue(showTime);
    if (userShowReserves === null)
      throw new AppError("user-per-show reserves is already empty", 406);
    await prisma.userReserve.delete({
      where: {
        userPerShowReserves: {
          user_id,
          showTime_id,
        },
      },
    });
    res.status(200).json({
      status: "ok",
      msg: "reservation deleted.",
    });
  } catch (err) {
    next(err);
  }
}
export async function retrieveReserve(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { showTime_id, userShowReserves, showTime } = await findReserve(
      req,
      res,
      next
    );
    await isShowTimeOverdue(showTime);
    res.status(200).json({
      showTime_id,
      reservedSeats: userShowReserves?.seat || [],
    });
  } catch (err) {
    next(err);
  }
}
