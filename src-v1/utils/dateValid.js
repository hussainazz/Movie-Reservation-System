import AppError from "./appError.js";

export async function dateValid(date) {
    // YYYY-MM-DD HOUR:MINUTE
    const DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2}$/;
    const isFormatCorrect = DATE_FORMAT_REGEX.test(date);

    if (!isFormatCorrect) {
        throw new AppError(
            `Date's format is wrong. Expected: YYYY-MM-DD. Received: ${date}`,
            400
        );
    }

    const [inputDate, inputTime] = date.split(" ");
    const [inputYear, inputMonth, inputDay] = inputDate.split("-").map(Number);

    if (inputMonth < 1 || inputMonth > 12)
        throw new AppError("Month out of range", 400);
    if (inputDay < 1 || inputDay > 31)
        throw new AppError("Day out of range", 400);
    const formattedCurrentDate = (() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    })();

    const [currentDate] = formattedCurrentDate.split(" ");
    const [currentYear, currentMonth, currentDay] = currentDate
        .split("-")
        .map(Number);

    if (inputYear < currentYear) {
        throw new AppError("Selected date is in the past", 400);
    }

    if (inputYear === currentYear && inputMonth < currentMonth) {
        throw new AppError("Selected month is in the past", 400);
    }

    if (
        inputYear === currentYear &&
        inputMonth === currentMonth &&
        inputDay < currentDay
    ) {
        throw new AppError("Selected day is in the past", 400);
    }
    return true;
}
