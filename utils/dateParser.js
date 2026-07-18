/**
 * Converts date option and time string into a valid Date object
 * @param {string} dateOption - 'Today', 'Tomorrow', or 'The next day'
 * @param {string} timeString - e.g., '12:30 AM', '11:15 PM', '09:00 AM'
 * @returns {Date} Compiled date object
 */
exports.parseWorryTime = (dateOption, timeString) => {
  const targetDate = new Date();

  // 1. Adjust the day based on the preset
  const normalizedOption = dateOption.toLowerCase().trim();
  if (normalizedOption === 'tomorrow') {
    targetDate.setDate(targetDate.getDate() + 1);
  } else if (normalizedOption === 'the next day') {
    targetDate.setDate(targetDate.getDate() + 2);
  } // 'today' doesn't need a date adjustment

  // 2. Parse time string (e.g., "12:30 AM" or "09:15 PM")
  const timeRegex = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
  const match = timeString.match(timeRegex);

  if (!match) {
    throw new Error('Invalid time format. Please use "HH:MM AM/PM" (e.g., 12:30 AM)');
  }

  let [_, hours, minutes, modifier] = match;
  hours = parseInt(hours, 10);
  minutes = parseInt(minutes, 10);

  // Convert 12-hour format to 24-hour format
  if (modifier.toUpperCase() === 'PM' && hours < 12) {
    hours += 12;
  }
  if (modifier.toUpperCase() === 'AM' && hours === 12) {
    hours = 0;
  }

  // Set local hours, minutes, seconds, and milliseconds
  targetDate.setHours(hours, minutes, 0, 0);

  return targetDate;
};