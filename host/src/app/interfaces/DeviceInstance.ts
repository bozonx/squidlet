export default interface DeviceInstance {
  init: () => Promise<void>;
  listenStatus: () => void;
  listenConfig: () => void;
  setConfig: (partialConfig: object) => void;
  //validate: (definition: EntityDefinition) => string | undefined;
  [index: string]: any;
}
