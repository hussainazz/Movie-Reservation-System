import express from "express";
import {
  retrieveMovies,
  addMovie,
  deleteMovie,
} from "../controllers/movieController.ts";
import {
  routeProtector,
  authorizeRole,
} from "../controllers/authController.ts";
const router = express.Router();

router.get("", retrieveMovies);
router.get("/:movieId", retrieveMovies);
router.get("/:movieId/showTimes", retrieveMovies);
router.post("", routeProtector, authorizeRole, addMovie);
router.delete("", routeProtector, authorizeRole, deleteMovie);

export { router as moviesRouter };
