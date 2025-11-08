import AppError from "./appError.ts";

export async function isTimeValid(start, end) {
  const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!TIME_REGEX.test(start) || !TIME_REGEX.test(end)) {
    throw new AppError("Time format is wrong. Expected: HH:MM (24h)", 400);
  }

  const [startHour, startMin] = start.split(":").map(Number);
  const [endHour, endMin] = end.split(":").map(Number);

  const startTotal = startHour * 60 + startMin;
  const endTotal = endHour * 60 + endMin;
  const durationMinutes = endTotal - startTotal;

  if (durationMinutes <= 0) {
    throw new AppError("End time must be after start time", 400);
  }

  const minDuration = 60;
  const maxDuration = 5 * 60;

  if (durationMinutes < minDuration || durationMinutes > maxDuration) {
    throw new AppError("Duration must be between 1 and 5 hours", 400);
  }

  return true;
}
