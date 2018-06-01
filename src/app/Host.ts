import App from "./App";
import Destination from "./interfaces/Destination";
import DeviceManifest from "./interfaces/DeviceManifest";
import DeviceConf from "./interfaces/DeviceConf";


export default class HostConfig {
  private readonly app: App;
  private readonly _config: {[index: string]: any};

  get id(): string {

    // TODO: return id of current host - master or room.hostName

    return 'master';
  }


  get isMaster(): boolean {

    // TODO: на каждом хосте определять

    return true;
  }


  /**
   * Manifests by device class name
   */
  get devicesManifests(): {[index: string]: DeviceManifest} {
    // TODO: !!!

    return {};
  }

  /**
   * Devices config by ids
   */
  get devicesConfigs(): {[index: string]: DeviceConf} {
    // TODO: !!!

    return {};
  }

  get driversList(): object {
    // TODO: !!!

    return {};
  }

  /**
   * Full host config
   */
  get config(): {[index: string]: any} {

    // TODO: use immutable

    return this._config;
  }

  constructor(app) {
    this.app = app;
  }

  getAddress(type: string, bus: string): string | undefined {
    const addrConfig = this.config.address;

    if (!addrConfig) return;

    // TODO: если несколько адресов - выбрать тот что с заданным type и bus

    return addrConfig.address;
  }

  generateDestination(type: string, bus: string): Destination {
    return {
      host: this.id,
      type,
      bus,
      address: this.getAddress(type, bus),
    }
  }

}
