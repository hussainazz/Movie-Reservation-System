import express from "express";
import {
    addReserve,
    updateReserveSeat,
    removeReserve,
    retrieveReserve,
} from "../controllers/reserveController.js";

const router = express.Router();

router
    .route("/")
    .post(addReserve)
    .patch(updateReserveSeat)
    .delete(removeReserve);

router.get("/:showTimeId", retrieveReserve);

export { router as reserveRouter };
