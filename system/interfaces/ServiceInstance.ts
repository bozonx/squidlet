import BaseEntityInstance from './EntityInstanceBase';


export default interface ServiceInstance extends BaseEntityInstance {
  init?: () => Promise<void>;
  [index: string]: any;
}
