import express from "express";
import {
  authorizeRole,
  routeProtector,
} from "../controllers/authController.ts";
import {
  addShowTime,
  deleteShowTime,
  retrieveShowTimes,
} from "../controllers/showTimeController.ts";
const router = express.Router();

router
  .route("")
  .get(retrieveShowTimes)
  .all(routeProtector, authorizeRole)
  .post(addShowTime)
  .delete(deleteShowTime);

export { router as showTimeRouter };
