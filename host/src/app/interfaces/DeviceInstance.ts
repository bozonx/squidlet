import DeviceDefinition from './DeviceDefinition';

export default interface DeviceInstance {
  init: () => Promise<void>;
  listenStatus: () => void;
  listenConfig: () => void;
  setConfig: (partialConfig: object) => void;
  validate: (deviceConf: DeviceDefinition) => string | undefined;
  [index: string]: any;
}
