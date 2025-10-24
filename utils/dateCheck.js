import AppError from "./appError.js";

export async function isDateValid(date) {
    // YYYY-MM-DD HOUR:MINUTE
    const DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
    const isFormatCorrect = DATE_FORMAT_REGEX.test(date);
    
    if (!isFormatCorrect) {
        throw new AppError(`Date's format is wrong. Expected: YYYY-MM-DD HH:MM. Received: ${date}`, 400);
    }
    
    const [inputDate, inputTime] = date.split(' ');
    const [inputYear, inputMonth, inputDay] = inputDate.split('-').map(Number);
    const [inputHour, inputMinute] = inputTime.split(':').map(Number);

    if (inputMonth < 1 || inputMonth > 12) throw new AppError('Month out of range', 400);
    if (inputHour < 0 || inputHour > 23) throw new AppError('Hour out of range', 400);
    if (inputMinute < 0 || inputMinute > 59) throw new AppError('Minute out of range', 400);
    if (inputDay < 1 || inputDay > 31) throw new AppError('Day out of range', 400);

    const formattedCurrentDate = (() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hour}:${minute}`;
    })();
    
    const [currentDate, currentTime] = formattedCurrentDate.split(' ');
    const [currentYear, currentMonth, currentDay] = currentDate.split('-').map(Number);
    const [currentHour, currentMinute] = currentTime.split(':').map(Number);

    if (inputYear < currentYear) {
        throw new AppError('Selected date is in the past', 400);
    }

    if (inputYear === currentYear && inputMonth < currentMonth) {
        throw new AppError('Selected month is in the past', 400);
    }

    if (inputYear === currentYear && 
        inputMonth === currentMonth && 
        inputDay < currentDay) {
        throw new AppError('Selected day is in the past', 400);
    }

    if (inputYear === currentYear && 
        inputMonth === currentMonth && 
        inputDay === currentDay && 
        inputHour < currentHour) {
        throw new AppError('Selected hour is in the past', 400);
    }

    // Check minute if same hour
    if (inputYear === currentYear && 
        inputMonth === currentMonth && 
        inputDay === currentDay && 
        inputHour === currentHour && 
        inputMinute <= currentMinute) {
        throw new AppError('Selected time is in the past or current time', 400);
    }

    return true;
}