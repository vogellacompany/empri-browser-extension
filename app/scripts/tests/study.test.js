import test from 'tape';
import { calcDaysSince } from "../study.js";


test('datediff1', function (t) {
  let days = calcDaysSince("2021-03-21", "2021-03-23")
  t.equal(days, 2)
  t.end()
});
