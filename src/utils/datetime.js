function toISO(dateValue) {
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function formatInTimeZone(isoDate, timeZone) {
  try {
    const formatter = new Intl.DateTimeFormat("sv-SE", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(new Date(isoDate));
    const map = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );
    const base = `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}:${map.second}`;

    return base;
  } catch (error) {
    return null;
  }
}

function getTimezoneOffsetMinutes(isoDate, timeZone) {
  const local = formatInTimeZone(isoDate, timeZone);
  if (!local) {
    return null;
  }

  const utcMs = new Date(isoDate).getTime();
  const localAsUtcMs = new Date(`${local}Z`).getTime();

  return Math.round((localAsUtcMs - utcMs) / 60000);
}

function formatWithOffset(isoDate, timeZone) {
  const local = formatInTimeZone(isoDate, timeZone);
  const offsetMinutes = getTimezoneOffsetMinutes(isoDate, timeZone);

  if (!local || offsetMinutes === null) {
    return null;
  }

  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const hours = String(Math.floor(abs / 60)).padStart(2, "0");
  const minutes = String(abs % 60).padStart(2, "0");

  return `${local}${sign}${hours}:${minutes}`;
}

function isValidTimezone(timeZone) {
  try {
    Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  toISO,
  formatWithOffset,
  isValidTimezone,
};
