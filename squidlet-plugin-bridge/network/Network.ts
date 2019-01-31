import Router from './Router';
import DriverEnv from '../../host/entities/DriverEnv';
import HostNetworkConfig from './interfaces/HostNetworkConfig';


/**
 * Network connection manager.
 * It works independent.
 */
export default class Network {
  _hostId?: string;
  _config?: HostNetworkConfig;

  get hostId(): string {
    return this._hostId as string;
  }

  get config(): HostNetworkConfig {
    return this._config as HostNetworkConfig;
  }

  private readonly driverEnv: DriverEnv;
  private readonly router: Router;

  constructor(driverEnv: DriverEnv) {
    this.driverEnv = driverEnv;
    this.router = new Router(this, this.driverEnv);
  }

  init(hostId: string, config: HostNetworkConfig): void {
    this._hostId = hostId;
    this._config = config;
    this.router.init();
  }

  async send(toHost: string, payload: any): Promise<void> {

    // TODO: можеть на всякий случай ждать таймаут чтобы не было зависших запросов ?

    return this.router.send(toHost, payload);
  }

  listenIncome(handler: (error: Error | null, payload?: any) => void): number {
    return this.router.listenIncome(handler);
  }

  removeListener(handlerIndex: number): void {
    this.router.removeListener(handlerIndex);
  }

}
