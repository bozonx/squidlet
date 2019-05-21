import BaseEntityInstance from './EntityInstanceBase';


export default interface DeviceInstance extends BaseEntityInstance {
  actions?: {[index: string]: (...p: any[]) => any};

  // TODO: review
  // listenStatus: () => void;
  // listenConfig: () => void;
  // setConfig: (partialConfig: object) => void;

  //validate?: (definition: EntityDefinition) => string | undefined;
  [index: string]: any;
}
