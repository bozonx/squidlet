export default interface DeviceInstance {
  init?: () => Promise<void>;

  actions: {[index: string]: (...p: any[]) => any};

  // TODO: review
  // listenStatus: () => void;
  // listenConfig: () => void;
  // setConfig: (partialConfig: object) => void;

  //validate?: (definition: EntityDefinition) => string | undefined;
  [index: string]: any;
}
