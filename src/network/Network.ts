import System from '../app/System';
import Router from './Router';
import Bridge from '../messenger/Bridge';

/**
 * Network connection manager.
 * It works independent of app
 */
export default class Network {
  private readonly system: System;
  private readonly router: Router;
  private readonly bridge: Bridge;

  constructor(system: System) {
    this.system = system;
    this.router = new Router(app);
    this.bridge = new Bridge(app, this);
  }
}
