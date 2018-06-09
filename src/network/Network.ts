import App from '../app/App';
import Router from './Router';
import Bridge from '../messenger/Bridge';

/**
 * Network connection manager.
 * It works independent of app
 */
export default class Network {
  private readonly app: App;
  private readonly router: Router;
  private readonly bridge: Bridge;

  constructor(app: App) {
    this.app = app;
    this.router = new Router(app);
    this.bridge = new Bridge(app, this);
  }
}
