/**
 * It call specified callback on specified interval.
 * A new start means - clear previous interval and start a new one.
 */
export default class Republish {
  private readonly republishInterval: number = 0;
  private intervalId: any;


  constructor(republishInterval: number) {
    this.republishInterval = republishInterval;
  }


  start(cb: () => void) {
    // if it doesn't set - do nothing
    if (!this.republishInterval) return;

    if (this.intervalId) {
      this.stop();
    }

    this.intervalId = setInterval(() => {
      cb();
    }, this.republishInterval);
  }

  stop() {
    clearInterval(this.intervalId);
    delete this.intervalId;
  }

}
