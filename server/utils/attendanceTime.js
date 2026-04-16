const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const customParseFormat = require("dayjs/plugin/customParseFormat");

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

const ATTENDANCE_TIMEZONE = process.env.ATTENDANCE_TIMEZONE || "Asia/Kolkata";

const hasExplicitTimezone = (value) => /[zZ]|[+\-]\d{2}:\d{2}$/.test(value);

function parseAttendanceDateTime(value, inputTimezone = ATTENDANCE_TIMEZONE) {
  if (value === null || value === undefined || value === "") return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }

  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const raw = String(value).trim();
  if (!raw) return null;

  // Explicit UTC/offset values are parsed as exact instants.
  if (hasExplicitTimezone(raw)) {
    const parsed = dayjs(raw);
    return parsed.isValid() ? parsed.toDate() : null;
  }

  // Device/local clock style values: interpret in provided input timezone.
  const dateTimeMatch = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/
  );
  if (dateTimeMatch) {
    const [, y, m, d, hh, mm, ss = "00"] = dateTimeMatch;
    const normalized = `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
    const parsed = dayjs.tz(normalized, inputTimezone);
    if (parsed.isValid()) return parsed.toDate();
  }

  const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, y, m, d] = dateOnlyMatch;
    const parsed = dayjs.tz(`${y}-${m}-${d} 00:00:00`, inputTimezone);
    if (parsed.isValid()) return parsed.toDate();
  }

  // Fallback for unexpected formats.
  const fallback = new Date(raw);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function getAttendanceDateUTC(dateLike) {
  const date = parseAttendanceDateTime(dateLike);
  if (!date) return null;

  const key = dayjs(date).tz(ATTENDANCE_TIMEZONE).format("YYYY-MM-DD");
  return dayjs.tz(`${key} 00:00:00`, ATTENDANCE_TIMEZONE).utc().toDate();
}

function getAttendanceDateKey(dateLike) {
  const date = parseAttendanceDateTime(dateLike);
  if (!date) return null;
  return dayjs(date).tz(ATTENDANCE_TIMEZONE).format("YYYY-MM-DD");
}

function getMinutesInAttendanceTimezone(dateLike) {
  const date = parseAttendanceDateTime(dateLike);
  if (!date) return null;

  const zdt = dayjs(date).tz(ATTENDANCE_TIMEZONE);
  return zdt.hour() * 60 + zdt.minute();
}

function mergeAttendanceDateAndTime(baseDateLike, timeLike) {
  const baseDate = parseAttendanceDateTime(baseDateLike);
  const timeDate = parseAttendanceDateTime(timeLike);
  if (!baseDate || !timeDate) return null;

  const base = dayjs(baseDate).tz(ATTENDANCE_TIMEZONE);
  const time = dayjs(timeDate).tz(ATTENDANCE_TIMEZONE);

  return base
    .hour(time.hour())
    .minute(time.minute())
    .second(0)
    .millisecond(0)
    .utc()
    .toDate();
}

module.exports = {
  ATTENDANCE_TIMEZONE,
  parseAttendanceDateTime,
  getAttendanceDateUTC,
  getAttendanceDateKey,
  getMinutesInAttendanceTimezone,
  mergeAttendanceDateAndTime,
};
