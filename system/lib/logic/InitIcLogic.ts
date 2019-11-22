type Timeout = NodeJS.Timeout;

import Promised from '../Promised';


/**
 * Try to init IC making interval calls for infinity.
 * if initCb has been rejected then the next try will be started right now if timeout is exceeded
 * of after interval timeout has been finished.
 */
export default class InitIcLogic {
  get initPromise(): Promise<void> {
    return this.initIcPromised.promise;
  }
  get isSetupStep(): boolean {
    return this.setupStep;
  }
  get isInitIcStep(): boolean {
    return Boolean(this.timeoutOfTry || this.timeoutPromised);
  }
  get wasInitialized(): boolean {
    return !this.setupStep && !this.isInitIcStep;
  }

  private readonly initCb: () => Promise<void>;
  // time from the beginning to start initializing IC
  private setupStep: boolean = true;
  private initIcPromised = new Promised<void>();
  private readonly logError: (message: Error) => void;
  private readonly minIntervalSec: number;
  private timeoutPromised?: Promised<void>;
  private timeoutOfTry?: Timeout;


  constructor(
    initCb: () => Promise<void>,
    logError: (message: Error) => void,
    minIntervalSec: number,
  ) {
    this.initCb = initCb;
    this.logError = logError;
    this.minIntervalSec = minIntervalSec;
  }

  destroy() {
    this.cancel();
    // TODO: better to resolve
    this.initIcPromised.destroy();

    delete this.initIcPromised;
  }


  init() {
    if (this.isInitIcStep) throw new Error(`IC is already initializing at the moment`);

    // mark end of setup step
    this.setupStep = false;

    this.callInitCb()
      .catch(this.logError);
  }

  cancel() {
    if (!this.wasInitialized) {
      this.setupStep = true;
    }

    this.timeoutOfTry && clearTimeout(this.timeoutOfTry);
    // TODO: better to resolve
    this.timeoutPromised && this.timeoutPromised.destroy();

    delete this.timeoutOfTry;
    delete this.timeoutPromised;
  }


  private callInitCb = async () => {
    this.timeoutPromised = new Promised<void>();
    this.timeoutOfTry = setTimeout(() => {
      this.timeoutPromised && this.timeoutPromised.resolve();
    }, this.minIntervalSec * 1000);

    // try to call cb and wait while it has been finished
    try {
      await this.initCb();
    }
    catch (e) {
      return this.handleCbError();
    }

    this.handleCbSuccess();
  }

  private async handleCbError() {
    // means cancelled
    if (!this.timeoutPromised || !this.timeoutOfTry) return this.cancel();

    // if request has been finished before timeout then wait for interval timeout
    if (!this.timeoutPromised.isFulfilled()) await this.timeoutPromised.promise;

    this.timeoutPromised.destroy();

    this.callInitCb()
      .catch(this.logError);
  }

  private handleCbSuccess() {
    // means cancelled
    if (!this.timeoutPromised || !this.timeoutOfTry) return this.cancel();

    // success
    clearTimeout(this.timeoutOfTry);
    this.timeoutPromised.destroy();

    delete this.timeoutOfTry;
    delete this.timeoutPromised;

    this.initIcPromised.resolve();
  }

}
