const Timeunit = {
  Year: "year",
  Month: "month",
  Day: "day",
  Hour: "hour",
  Minute: "minute",
  Second: "second",
}

const absoluteFormat = {
  [Timeunit.Year]: { year: "numeric" },
  [Timeunit.Month]: { year: "numeric", month: "short" },
  [Timeunit.Day]: { year: "numeric", month: "short", day: "numeric" },
  [Timeunit.Hour]: { year: "numeric", month: "short", day: "numeric" },
  [Timeunit.Minute]: { year: "numeric", month: "short", day: "numeric" },
  [Timeunit.Second]: { year: "numeric", month: "short", day: "numeric" },
}

function formatRelative(dateTime, unit) {
  switch (unit) { // fall through
    case Timeunit.Second: // treated like minute, no "5 sec ago"
    case Timeunit.Minute:
      let minDiff = Math.abs(dateTime.diffNow("minutes").minutes)
      if (minDiff < 1) {
        return "this minute"
      }
      if (minDiff < 60) {
        return dateTime.toRelativeCalendar({ unit: "minutes" })
      }
    case Timeunit.Hour:
      let hoursDiff = Math.abs(dateTime.diffNow("hours").hours)
      if (hoursDiff < 1) {
        return "this hour"
      }
      if (hoursDiff < 24) {
        return dateTime.toRelativeCalendar({ unit: "hours" })
      }
    case Timeunit.Day:
      // difference >30 days displayed absolute
      return dateTime.toRelativeCalendar({ unit: "days" })
    case Timeunit.Month:
      return dateTime.toRelativeCalendar({ unit: "months" })
    case Timeunit.Year:
      return dateTime.toRelativeCalendar({ unit: "years" })
  }
}

export function toFuzzyDate(dateTime, unit, relative=true) {
  let daysDiff = dateTime.diffNow("days").days
  if (relative && Math.abs(daysDiff) < 30) {
    // use relative format
    return formatRelative(dateTime, unit)
  } else {
    // use absolute format
    return dateTime.toLocaleString(absoluteFormat[unit])
  }
}
