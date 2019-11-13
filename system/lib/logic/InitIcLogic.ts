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
    return this.initIcStep;
  }
  get wasInitialized(): boolean {
    return !this.setupStep && !this.initIcStep;
  }

  private initCb: () => Promise<void>;
  private onInit: () => void;
  // time from the beginning to start initializing IC
  private setupStep: boolean = true;
  private initIcStep: boolean = false;
  private initIcPromised = new Promised<void>();
  private logError: (message: Error) => void;
  private minIntervalSec: number;


  constructor(
    initCb: () => Promise<void>,
    onInit: () => void,
    logError: (message: Error) => void,
    minIntervalSec: number,
  ) {
    this.initCb = initCb;
    this.onInit = onInit;
    this.logError = logError;
    this.minIntervalSec = minIntervalSec;
  }

  destroy() {
    this.initIcPromised.destroy();

    delete this.initIcPromised;
  }


  init() {
    if (this.initIcStep) throw new Error(`IC is already initializing at the moment`);

    // mark end of setup step
    this.setupStep = false;
    this.initIcStep = true;

    this.callInitCb()
      .catch(this.logError);
  }


  private callInitCb = async () => {
    const timeoutPromised = new Promised<void>();
    const timeoutOfTry = setTimeout(() => {
      timeoutPromised.resolve();
    }, this.minIntervalSec);

    // try to call cb and wait while it has been finished
    try {
      await this.initCb();
    }
    catch (e) {
      // if request has been finished before timeout then wait for interval timeout
      if (!timeoutPromised.isFulfilled()) await timeoutPromised.promise;

      timeoutPromised.destroy();

      this.callInitCb()
        .catch(this.logError);

      return;
    }

    // success
    clearTimeout(timeoutOfTry);
    timeoutPromised.destroy();

    this.initIcStep = false;

    this.initIcPromised.resolve();
  }

}
