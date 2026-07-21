/**
 * Converts a date option + time string into a UTC Date object.
 *
 * Fix #3: Server timezone bug.
 * Previously used server-local time (new Date() + setHours), which produced wrong
 * worry times when the server runs in UTC but the user is in a different timezone.
 *
 * Solution: The client sends its UTC offset (in minutes, as returned by
 * Date.prototype.getTimezoneOffset()). We reconstruct the target time entirely
 * in UTC by accounting for that offset, so the stored Date is always correct
 * regardless of the server's local timezone.
 *
 * @param {string} dateOption   - 'today' | 'tomorrow' | 'the next day' | 'custom'
 * @param {string} timeString   - "HH:MM" in 24-hour format (from <input type="time">)
 * @param {number} tzOffset     - Client's timezone offset in minutes (from getTimezoneOffset())
 *                                Positive = behind UTC (e.g. UTC-6 → 360), Negative = ahead of UTC (e.g. UTC+6 → -360)
 * @param {string} [customDate] - ISO date string "YYYY-MM-DD" when dateOption is 'custom'
 * @returns {Date} Correct UTC Date object
 */
exports.parseWorryTime = (dateOption, timeString, tzOffset, customDate) => {
  // Validate tzOffset — default to 0 (UTC) if missing or invalid
  const offsetMinutes = typeof tzOffset === 'number' && isFinite(tzOffset) ? tzOffset : 0;

  // --- 1. Parse the HH:MM time string (native time input, 24-hour) ---
  const timeRegex = /^(\d{1,2}):(\d{2})$/;
  const match = timeString.match(timeRegex);
  if (!match) {
    throw new Error('Invalid time format. Please use HH:MM (e.g. 14:30).');
  }
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours > 23 || minutes > 59) {
    throw new Error('Invalid time value.');
  }

  // --- 2. Determine the target local date in the client's timezone ---
  // We build a "local midnight" in the client's timezone using UTC arithmetic.
  // Client local now = UTC now - offsetMinutes
  const nowUTC = Date.now();
  const localNowMs = nowUTC - offsetMinutes * 60 * 1000;
  const localNow = new Date(localNowMs);

  // Zero out to local midnight (year/month/day only)
  const localYear  = localNow.getUTCFullYear();
  const localMonth = localNow.getUTCMonth();
  const localDay   = localNow.getUTCDate();

  let targetLocalMidnight;

  const normalized = (dateOption || '').toLowerCase().trim();

  if (normalized === 'custom') {
    // Fix #13: custom date support — client sends "YYYY-MM-DD"
    if (!customDate || !/^\d{4}-\d{2}-\d{2}$/.test(customDate)) {
      throw new Error('A valid custom date (YYYY-MM-DD) is required.');
    }
    const [y, m, d] = customDate.split('-').map(Number);
    // Build UTC midnight for that local date
    targetLocalMidnight = Date.UTC(y, m - 1, d);
  } else {
    let dayOffset = 0;
    if (normalized === 'tomorrow')      dayOffset = 1;
    else if (normalized === 'the next day') dayOffset = 2;
    // 'today' → dayOffset stays 0

    // Build UTC ms for local midnight of the target day
    targetLocalMidnight = Date.UTC(localYear, localMonth, localDay + dayOffset);
  }

  // --- 3. Add the chosen time (in local minutes) to get local timestamp ---
  const localTimeMs = targetLocalMidnight + (hours * 60 + minutes) * 60 * 1000;

  // --- 4. Convert local timestamp to UTC by adding back the offset ---
  const utcMs = localTimeMs + offsetMinutes * 60 * 1000;

  return new Date(utcMs);
};
