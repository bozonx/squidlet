export default class Republish {
  private readonly republishInterval: number = 0;
  private intervalId: any;

  constructor(republishInterval: number) {
    this.republishInterval = republishInterval;
  }


  start(cb: () => void) {
    if (!this.republishInterval) return;

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    setInterval(() => {
      cb();
    }, this.republishInterval);
  }

}
