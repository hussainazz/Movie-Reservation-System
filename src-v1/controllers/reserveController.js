import UserReservations from "../models/reserveModel.js";
import ShowTime from "../models/showTimeModel.js";
import AppError from "../utils/appError.js";
import { updateShowTimeReserves } from "./showTimeController.js";
import { findShowTime } from "./showTimeController.js";
const { default: Seats } = await import("../seedTables/seats.json", {
    with: { type: "json" },
});

let checkSeatId = (req, res) => {
    let { seat_id } = req.body;
    if (seat_id.length !== 0) {
        seat_id.forEach((id) => {
            if (!Seats.includes(id) && req.method !== "PATCH") {
                throw new AppError("Invalid seat id.", 404);
            }
        });
    }
    return seat_id.sort();
};

export async function isSeatAvailable(showTime_id, seat_id) {
    const showTimeReserves = await ShowTime.findOne({
        where: { showTime_id },
    });

    if (showTimeReserves.remained_capacity === 0) {
        throw new AppError("All of the seats are reserved.", 409);
    }

    const reservedSeats = showTimeReserves.reserved_seats.sort();
    const seatsOfShow = Seats.slice(0, showTimeReserves.capacity);

    if (seat_id) {
        let alreadyReserved = [];
        reservedSeats.forEach((seat) => {
            if (seat_id.includes(seat)) {
                alreadyReserved.push(seat);
            }
        });
        let seatsOfShow_set = new Set(seatsOfShow);
        let isSeatIncluded = seat_id.filter(
            (seat) => !seatsOfShow_set.has(seat)
        );
        if (isSeatIncluded.length > 0) {
            throw new AppError(
                `seat id is not acceptable for this show: ${isSeatIncluded}`,
                405
            );
        }
        if (alreadyReserved.length > 0) {
            throw new AppError(
                `seat(s) is already reserved: ${alreadyReserved}`,
                409
            );
        }
    } else {
        let reservedSeatsIdSet = new Set(reservedSeats);
        let available_seats = seatsOfShow.filter(
            (seat) => !reservedSeatsIdSet.has(seat)
        );
        return available_seats;
    }

    return true;
}

export async function isShowTimeOverdue(showTime) {
    try {
        await isDateValid(showTime.date);
    } catch {
        throw new AppError("schedule of showTime has been passed", 404);
    }
}

let findReserve = async (req, res) => {
    const user_id = res.locals.user.user_id;
    let showTime;
    let showTime_id;
    if (req.method !== "GET") {
        showTime_id = req?.body?.showTime_id;
        if (showTime_id) {
            showTime = await findShowTime(showTime_id);
        }
    } else {
        showTime_id = req.params.showTimeId;
    }

    const reserved = await UserReservations.findOne({
        where: { user_id, showTime_id },
    });
    // adding reserve
    if (reserved !== null && req.method === "POST") {
        throw new AppError(
            "reservation for this user-showtime is already created.",
            405
        );
    }
    // updating reserve
    if (reserved === null && req.method !== "POST") {
        throw new AppError(
            "user does not have any reservation for this showtime.",
            405
        );
    }
    return { user_id, reserved, showTime_id, showTime };
};

export async function addReserve(req, res, next) {
    try {
        const addSeat = checkSeatId(req, res, next);

        const { user_id, showTime_id, showTime } =
            (await findReserve(req, res, next)) || "";

        if (!user_id || !showTime_id) {
            next(new AppError(`user_id/showTime_id is empty`, 400));
        }

        await isShowTimeOverdue(showTime);
        await isSeatAvailable(showTime_id, addSeat);
        await UserReservations.create({
            user_id,
            showTime_id,
            reservedSeats: addSeat,
        });
        await updateShowTimeReserves(showTime_id, addSeat);

        res.status(201).json({
            status: "ok",
            msg: "new reserve has been added successfully.",
        });
    } catch (err) {
        next(err);
    }
}
export async function updateReserveSeat(req, res, next) {
    try {
        const newReservation = checkSeatId(req, res);
        const { user_id, showTime_id, reserved, showTime } =
            (await findReserve(req, res, next)) || "";
        if (!user_id || !showTime_id) {
            new Error(`user_id/showTime_id is empty`);
        }
        await isShowTimeOverdue(showTime);

        const previousReservation = reserved.dataValues.reservedSeats.sort();
        console.log("newReservation: ", newReservation);
        console.log("previousReservation: ", previousReservation);
        let reserveIsChanged = (() => {
            // -> (addedSeats.length == 0 && removedSeats.length == 0)
            if (previousReservation.length === newReservation.length) {
                return previousReservation.every(
                    (value, index) => value === newReservation[index]
                )
                    ? false
                    : true;
            }
            return true;
        })();
        if (reserveIsChanged) {
            let final_reserve = [];

            const removedSeats = previousReservation.filter((id) => {
                return !newReservation.includes(id);
            });
            const addedSeats = newReservation.filter((id) => {
                return !previousReservation.includes(id);
            });

            if (removedSeats.length !== 0) {
                final_reserve.push(
                    ...previousReservation.filter((id) => {
                        return !removedSeats.includes(id);
                    })
                );
            }
            if (addedSeats.length !== 0) {
                await isSeatAvailable(showTime_id, addedSeats);
                if (final_reserve.length !== 0) {
                    final_reserve.push(...addedSeats);
                } else {
                    final_reserve.push(
                        previousReservation.concat(...addedSeats)
                    );
                }
            }
            await updateShowTimeReserves(showTime_id, addedSeats, removedSeats);
            await UserReservations.update(
                { reservedSeats: final_reserve },
                { where: { user_id, showTime_id } }
            );
        }

        res.status(200).json({
            status: "ok",
            msg: "updated successfully",
        });
    } catch (err) {
        next(err);
    }
}
export async function removeReserve(req, res, next) {
    try {
        const { user_id, showTime_id, reserved, showTime } = await findReserve(
            req,
            res,
            next
        );
        if (!user_id || !showTime_id) {
            new Error(`user_id/showTime_id is empty`);
        }
        await isShowTimeOverdue(showTime);
        await updateShowTimeReserves(showTime_id, "", reserved.reservedSeats);

        await reserved.destroy();
        res.status(200).json({
            status: "ok",
            msg: "reservation deleted.",
        });
    } catch (err) {
        next(err);
    }
}
export async function retrieveReserve(req, res, next) {
    try {
        const { user_id, showTime_id, reserved, showTime } = await findReserve(
            req,
            res,
            next
        );
        if (!user_id || !showTime_id) {
            new Error(`user_id/showTime_id is empty`);
        }
        await isShowTimeOverdue(showTime);

        res.status(200).json({
            reservationId: reserved.dataValues.id,
            showTimeId: reserved.dataValues.showTime_id,
            reservedSeats: reserved.dataValues.reservedSeats,
        });
    } catch (err) {
        next(err);
    }
}
