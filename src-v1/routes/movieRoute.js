import express from "express";
import {
    retrieveMovies,
    addMovie,
    deleteMovie,
} from "../controllers/movieController.js";
import {
    routeProtector,
    authorizeRole,
} from "../controllers/authController.js";
import {retrieveShowTimes} from "../controllers/showTimeController.js"
const router = express.Router();

router.get("", retrieveMovies);
router.get("/:movieId/showTimes", retrieveMovies)
// router.get("/:movieId/showTimes", retrieveMovies)
router.post("", routeProtector, authorizeRole, addMovie);
router.delete("", routeProtector, authorizeRole, deleteMovie);

export { router as moviesRouter };