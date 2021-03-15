import test from 'tape';
import { RunningStats } from "../stats.js";


test('wikivec1', function (t) {
  let stats = new RunningStats()
  let data = [4, 7, 13, 16]
  data.forEach(x => stats.update(x))
  t.equal(stats.mean, 10)
  t.equal(stats.variance, 30)
  t.end()
});

test('wikivec2', function (t) {
  let stats = new RunningStats()
  let data = [1e8 + 4, 1e8 + 7, 1e8 + 13, 1e8 + 16]
  data.forEach(x => stats.update(x))
  t.equal(stats.mean, 1e8 + 10)
  t.equal(stats.variance, 30)
  t.end()
});

test('wikivec3', function (t) {
  let stats = new RunningStats()
  let data = [1e9 + 4, 1e9 + 7, 1e9 + 13, 1e9 + 16]
  data.forEach(x => stats.update(x))
  t.equal(stats.mean, 1e9 + 10)
  t.equal(stats.variance, 30)
  t.end()
});
