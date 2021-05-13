const Timeunit = {
  Year: "year",
  Month: "month",
  Day: "day",
  Hour: "hour",
  Minute: "minute",
  Second: "second",
}


function absoluteFormat(unit, thisYear, time=false) {
  let format = {}
  switch (unit) { // fall through
    case Timeunit.Second: // treated like minute, GH never shows seconds
    case Timeunit.Minute:
      if (time) {
        format.minute = "2-digit"
      }
    case Timeunit.Hour:
      if (time) {
        format.hour = "2-digit"
        format.timeZoneName = "short"
      }
    case Timeunit.Day:
      format.day = "numeric"
    case Timeunit.Month:
      format.month = "short"
    case Timeunit.Year:
      if (!thisYear || time || unit == Timeunit.Year) {
        format.year = "numeric"
      }
  }
  return format
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

export function toFuzzyDate(dateTime, unit, relative=true, time=false, locale="en-gb") {
  let daysDiff = dateTime.diffNow("days").days
  dateTime = dateTime.setLocale(locale)
  if (relative && Math.abs(daysDiff) < 30) {
    // use relative format
    return formatRelative(dateTime, unit)
  } else {
    // use absolute format
    let curYear = new Date().getFullYear()
    let isThisYear = (dateTime.year == curYear)
    return dateTime.toLocaleString(absoluteFormat(unit, isThisYear, time))
  }
}
