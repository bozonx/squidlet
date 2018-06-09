import System from '../app/System';
import Router from './Router';


/**
 * Network connection manager.
 * It works independent.
 */
export default class Network {
  private readonly system: System;
  private readonly router: Router;

  constructor(system: System) {
    this.system = system;
    this.router = new Router(this.system);
  }

  init(): void {
    this.router.init();
  }

}
