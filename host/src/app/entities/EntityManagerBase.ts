import System from '../System';


export default class EntityManagerBase {
  protected readonly system: System;

  constructor(system: System) {
    this.system = system;
  }
}
