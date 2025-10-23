import express from "express";
import {
    authorizeRole,
    routeProtector,
} from "../controllers/authController.js";
import {
    addShowTime,
    deleteShowTime,
    retrieveShowTime,
} from "../controllers/showTimeController.js";

const router = express.Router();

router
    .route("/")
    .all(routeProtector, authorizeRole)
    .post(addShowTime)
    .delete(deleteShowTime);

router.get("/:showTimeId", retrieveShowTime);
export { router as showTimeRouter };
