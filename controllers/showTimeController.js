import ShowTime from "../models/showTimeModel.js";
import AppError from "../utils/appError.js";

export async function findShowTime(showTime_id) {
    const showTime = await ShowTime.findOne({
        where: { showTime_id },
    });
    if (showTime === null) {
        throw new AppError("can't find showTime with this id.", 404)
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
        console.log("finalReserves after adding :", finalReserves);
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
        console.log("finalReserves after removing :", finalReserves);
    }
    showTime.reserved_seats = finalReserves;
    await showTime.save();
}

export async function retrieveShowTime(req, res, next) {
    try {
        const showTime_id = req.params.showTimeId;
        const showTime = await findShowTime(showTime_id);

        res.status(200).json({
            date: showTime.date,
            capacity: showTime.capacity,
            available_capacity: showTime.remained_capacity,
            reserved_seats: showTime.reserved_seats
        });
    } catch (err) {
        next(err);
    }
}
export async function addShowTime(req, res, next) {
    let movie_id;
    let date;
    let capacity;
    try {
        movie_id = req.body.movie_id;
        date = req.body.date;
        capacity = req.body.capacity;
    } catch {
        return next(
            new Error("movie_id, date and capacity should be defined", 204)
        );
    }
    try {
        await ShowTime.create({
            movie_id,
            date,
            capacity,
        });
    } catch (err) {
        throw new Error(err);
    }
    res.status(200).json({
        status: "ok",
        msg: `show time added successfully`,
    });
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
