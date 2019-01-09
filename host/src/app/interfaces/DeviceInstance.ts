export default interface DeviceInstance {
  init?: () => Promise<void>;

  // TODO: review
  // listenStatus: () => void;
  // listenConfig: () => void;
  // setConfig: (partialConfig: object) => void;

  //validate?: (definition: EntityDefinition) => string | undefined;
  [index: string]: any;
}
