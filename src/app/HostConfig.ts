import App from "./App";


export default class {
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

  getHostId() {

    // TODO: return id of current host - master or room.hostName

    return 'master';
  }

}
