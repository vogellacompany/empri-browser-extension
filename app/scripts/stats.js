export class RunningStats {
  // Online variance calculation based on Welford.
  // cf. https://www.johndcook.com/blog/standard_deviation/
  constructor(count = 0, mean = 0, v = 0) {
    this.count = 0
    this._mean = 0
    this._v = 0
  }

  update(x) {
    this.count++
    if (this.count == 1) {
      this._mean = x // first value
    } else {
      let prev_mean = this._mean
      this._mean += (x - this._mean) / this.count
      this._v += (x - prev_mean) * (x - this._mean)
    }
  }

  get mean() {
    if (this.count == 0) {
      return Number.NaN
    }
    return this._mean
  }

  get variance() {
    if (this.count < 2) {
      return Number.NaN
    }
    return this._v / (this.count - 1)
  }

  get std() {
    return Math.sqrt(this.variance)
  }
}
