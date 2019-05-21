import BaseEntityInstance from './EntityInstanceBase';

export default interface DriverInstance extends BaseEntityInstance {
  [index: string]: any;
}
