import App from "./App";
import Destination from "./interfaces/Destination";


export default class HostConfig {
  private readonly _app: App;
  private readonly _config: object;

  get config() {

    // TODO: use immutable

    return this._config;
  }

  constructor(app) {
    this._app = app;
  }

  isMaster() {

    // TODO: на каждом хосте определять

    return true;
  }

  getId() {

    // TODO: return id of current host - master or room.hostName

    return 'master';
  }

  getAddress(type: string, bus: string): string {

    // TODO: получить текущий адрес хоста

    return ''
  }

  generateDestination(type: string, bus: string): Destination {
    return {
      host: this.getId(),
      type,
      bus,
      address: this.getAddress(type, bus),
    }
  }

}
