import Promised from '../Promised';


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
  // time from the beginning to start initializing IC
  private setupStep: boolean = true;
  private initIcStep: boolean = false;
  private initIcPromised = new Promised<void>();


  constructor(initCb: () => Promise<void>) {
    this.initCb = initCb;
  }

  destroy() {
    this.initIcPromised.destroy();

    delete this.initIcPromised;
  }


  async init() {
    // mark end of setup step
    this.setupStep = false;
    this.initIcStep = true;

    try {
      await this.initCb();
    }
    catch (e) {
      this.initIcStep = false;

      // TODO: если произолша ошибка - как тогда потом проинициализироваться ????

      this.initIcPromised.reject(e);

      throw e;
    }

    this.initIcStep = false;

    this.initIcPromised.resolve();

  }

}
