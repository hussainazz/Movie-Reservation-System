import ShowTime from "../models/showTimeModel.js";
import AppError from "../utils/appError.js";
import { isSeatAvailable } from "./reserveController.js";
import { findMovie } from "./movieController.js";
import { isDateValid } from "../utils/dateCheck.js";

export async function retrieveShowTimes(req, res, next) {
    const dateFilter = req.query?.date;
    if (dateFilter) {
        let fullBookedShows = [];
        let availableShows = [];
        await isDateValid(dateFilter);
        const showTimes = await ShowTime.findAll({
            where: { date: dateFilter },
            attributes: { exclude: ["createdAt", "updatedAt"] },
        });
        if (showTimes !== null) {
            showTimes.forEach((show) => {
                if (show.remained_capacity === 0) {
                    return fullBookedShows.push(show);
                }
                availableShows.push(show);
            });
        }
        return res.status(200).json({
            fullBookedShows,
            availableShows,
        });
    }
}

export async function findShowTime(showTime_id) {
    const showTime = await ShowTime.findOne({
        where: { showTime_id },
    });
    if (showTime === null) {
        throw new AppError("can't find showTime with this id.", 404);
    }
    return showTime;
}

export async function updateShowTimeReserves(
    showTime_id,
    addReserveSeats,
    removeReservedSeats
) {
    let finalReserves = [];
    const showTime = await ShowTime.findOne({
        where: { showTime_id },
    });
    let showTimeReservedSeats = showTime.reserved_seats;
    console.log("all showtime reserves: ", showTimeReservedSeats);
    if (addReserveSeats && addReserveSeats.length > 0) {
        finalReserves.push(...showTimeReservedSeats.concat(...addReserveSeats));
        console.log("reserves after adding :", finalReserves);
    }
    if (removeReservedSeats && removeReservedSeats.length > 0) {
        if (finalReserves.length > 0) {
            finalReserves = finalReserves = finalReserves.filter((id) => {
                return !removeReservedSeats.includes(id);
            });
        } else {
            finalReserves = showTimeReservedSeats.filter((id) => {
                return !removeReservedSeats.includes(id);
            });
        }
        console.log("reserves after removing :", finalReserves);
    }
    console.log({ finalReserves });
    showTime.reserved_seats = finalReserves;
    await showTime.save();
}

export async function retrieveShowTime(req, res, next) {
    try {
        const showTime_id = req.params?.showTimeId;

        if (showTime_id) {
            const showTime = await findShowTime(showTime_id);
            const available_seats = await isSeatAvailable(showTime_id);

            return res.status(200).json({
                date: showTime.date,
                capacity: showTime.capacity,
                available_capacity: showTime.remained_capacity,
                reserved_seats: showTime.reserved_seats,
                available_seats,
            });
        }
    } catch (err) {
        next(err);
    }
}
export async function addShowTime(req, res, next) {
    try {
        let movie_id = req.body?.movie_id;
        let date = req.body?.date; // YYYY/DD/MM
        let capacity = req.body?.capacity;

        await findMovie(movie_id);
        await isDateValid(date);
        if (capacity > 204) {
            throw `capacity could not be more that 204`;
        }
        await ShowTime.create({
            movie_id,
            date,
            capacity,
        });

        res.status(200).json({
            status: "ok",
            msg: `show time added successfully`,
        });
    } catch (err) {
        next(err);
    }
}

export async function deleteShowTime(req, res, next) {
    await ShowTime.destroy({
        where: { showTime_id: req.body.showTime_id },
    });
    res.status(200).json({
        status: "ok",
        msg: "show time deleted successfully.",
    });
}
