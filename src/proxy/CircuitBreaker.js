class CircuitBreaker {
  constructor (threshold = 5, timeout = 60000, halfOpenAttempts = 2) {
    this.failureCount = 0;
    this.successCount = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.halfOpenAttempts = halfOpenAttempts;
    this.halfOpenSuccesses = 0;
    this.state = 'CLOSED';
    this.nextAttempt = 0;
    this.lastFailTime = 0;
  }

  canAttempt () {
    if (this.state === 'CLOSED') return true;

    if (this.state === 'OPEN') {
      if (Date.now() >= this.nextAttempt) {
        this.state = 'HALF_OPEN';
        this.halfOpenSuccesses = 0;
        return true;
      }
      return false;
    }

    return this.state === 'HALF_OPEN';
  }

  recordSuccess () {
    this.failureCount = 0;

    if (this.state === 'HALF_OPEN') {
      this.halfOpenSuccesses++;
      if (this.halfOpenSuccesses >= this.halfOpenAttempts) {
        this.state = 'CLOSED';
      }
    } else {
      this.successCount++;
    }
  }

  recordFailure () {
    this.failureCount++;
    this.lastFailTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    } else if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }

  getState () {
    return {
      state: this.state,
      failures: this.failureCount,
      canAttempt: this.canAttempt()
    };
  }
}

module.exports = CircuitBreaker;
