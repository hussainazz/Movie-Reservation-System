import UserReservations from "../models/reserveModel.js";
import ShowTime from "../models/showTimeModel.js";
import Seats from "../seedTables/seats.json" with { type: 'json' }
import AppError from "../utils/appError.js";
import { updateShowTimeReserves } from "./showTimeController.js";
import { findShowTime } from "./showTimeController.js";

let isSeatAvailable = async (showTime_id, seat_id, next) => {

    const showTimeReserves = await ShowTime.findOne({
        where: {showTime_id},
        attributes: ["reserved_seats"]
    })

    showTimeReserves.reserved_seats.sort()

    let alreadyReserved = [];

    seat_id.forEach(id => {
        if(showTimeReserves.reserved_seats.includes(id)) {
            alreadyReserved.push(id)
        }
    })

    if(alreadyReserved.length > 0) {
        next(new AppError("seat(s) is already reserved.", 409))
        throw console.log(`already-reserved-seats: ${alreadyReserved}`)
    }

    return true
}


let checkSeatId = (req ,res) => {
    let {seat_id} = req.body;
    if(seat_id.length !== 0){
        seat_id.forEach(id => {
            if(!Seats.includes(id) && req.method !== "PATCH") {
                throw new AppError("Invalid seat id.", 404);
            }
        });
    }
    return seat_id.sort()
}

let findReserve = async (req, res) => {
    const user_id = res.locals.user.user_id;
    let showTime_id;
    if(req.method !== "GET") {
        showTime_id = req?.body?.showTime_id
        if(showTime_id){
            await findShowTime(showTime_id)
        }
    } else {
        showTime_id = req.params.showTimeId
    }

    const reserved = await UserReservations.findOne({
        where: {user_id, showTime_id}
    })
    // adding reserve
    if(reserved !== null && req.method === "POST") {
        throw new AppError("reservation for this user-showtime is already created.", 405)
    }
    // updating reserve
    if(reserved === null && req.method !== "POST") {
        throw new AppError("user does not have any reservation for this showtime.", 405 )
    }
    return {user_id, reserved, showTime_id}
}

export async function addReserve(req, res, next) {
    try {
        const addSeat = checkSeatId(req, res, next)

        const {user_id, showTime_id} = await findReserve(req, res, next) || ""

        if(!user_id || !showTime_id) {
            next(new AppError(`user_id/showTime_id is empty`, 400))
        }

        const IsSeatAvailable = await isSeatAvailable(showTime_id, addSeat, next)
        const newReserve = await UserReservations.create({
            user_id,
            showTime_id,
            reservedSeats: addSeat
        })
        
        await updateShowTimeReserves(showTime_id, addSeat)

        res.status(201).json({
            status: 'ok',
            msg: "reservation added successfully."
        });
    } catch(err) {
        console.log("here")
        next(err)
    }
}
export async function updateReserveSeat(req, res, next) {
    try {
        const newReservation = checkSeatId(req, res)
        const {user_id, showTime_id, reserved} = await findReserve(req, res, next) || ""
        if(!user_id || !showTime_id) {
            new Error(`user_id/showTime_id is empty`)
        } 
        
        const previousReservation = reserved.dataValues.reservedSeats.sort()
        console.log("newReservation: ", newReservation)
        console.log("previousReservation: ", previousReservation)
        let reserveIsChanged = (() => {
            // -> (addedSeats.length == 0 && removedSeats.length == 0)
            if(previousReservation.length === newReservation.length) {
                return previousReservation.every((value, index) => value === newReservation[index]) ? false : true
            } 
            return true
        })()
        if(reserveIsChanged) {
            let final_reserve = [];
        
            const removedSeats = previousReservation.filter(id => {
                return !newReservation.includes(id)
            })
            const addedSeats = newReservation.filter(id => {
                return !previousReservation.includes(id)
            })

            if(removedSeats.length !== 0) {
                final_reserve.push(...previousReservation.filter(id => {
                    return !removedSeats.includes(id)
                }))
            }
            if(addedSeats.length !== 0) {
                await isSeatAvailable(showTime_id, addedSeats, next)
                if(final_reserve.length !== 0) {
                    final_reserve.push(...addedSeats)
                }
                else {
                    final_reserve.push(previousReservation.concat(...addedSeats))
                }
            }
            console.log("addedSeats", addedSeats)
            console.log("removedSeats", removedSeats)
            await updateShowTimeReserves(showTime_id, addedSeats, removedSeats)
            await UserReservations.update(
                {reservedSeats: final_reserve},
                { where: { user_id, showTime_id }}
            )
        }

        res.status(200).json({
            status: 'ok',
            msg: "updated successfully"
        })
    } catch(err) {
        next(err)
    }
}
export async function removeReserve(req, res, next) {
    try {
        const {user_id, showTime_id, reserved} = await findReserve(req, res, next)
        if(!user_id || !showTime_id) {
            new Error(`user_id/showTime_id is empty`)
        }

        await reserved.destroy()
        res.status(200).json({
            status: 'ok',
            msg: "reservation deleted."
        })
    } catch(err) {
        next(err)
    }
}
export async function retrieveReserve(req, res, next) {
    try {   
        const {user_id, showTime_id, reserved} = await findReserve(req, res, next)
        if(!user_id || !showTime_id) {
            new Error(`user_id/showTime_id is empty`)
        }

        res.status(200).json({
            reservationId: reserved.dataValues.id,
            showTimeId: reserved.dataValues.showTime_id,
            reservedSeats: reserved.dataValues.reservedSeats
        })
    } catch(err) {
        next(err)
    }
}