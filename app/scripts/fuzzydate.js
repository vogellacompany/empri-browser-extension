const Timeunit = {
  Year: "year",
  Month: "month",
  Day: "day",
  Hour: "hour",
  Minute: "minute",
  Second: "second",
}

const timeUnitToRedactionText = {
  [Timeunit.Year]: (dateTime) => dateTime.toRelativeCalendar({ unit: "years" }),
  [Timeunit.Month]: (dateTime) => {
    if (dateTime.diffNow([ "months" ]).months >= -1) {
      return dateTime.toRelativeCalendar({ unit: "months" })
    } else {
      return dateTime.toRelativeCalendar()
    }
  },
  [Timeunit.Day]: (dateTime) => dateTime.toRelativeCalendar(),
  [Timeunit.Hour]: (dateTime) => dateTime.toRelativeCalendar(),
  [Timeunit.Minute]: (dateTime) => dateTime.toRelativeCalendar(),
  [Timeunit.Second]: (dateTime) => dateTime.toRelativeCalendar(),
}

export function toFuzzyDate(dateTime, unit) {
  return timeUnitToRedactionText[unit](dateTime)
}
