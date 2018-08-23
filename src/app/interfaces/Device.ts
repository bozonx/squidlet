import DeviceDefinition from './DeviceDefinition';

export default interface Device {
  init: () => Promise<void>;
  listenStatus: () => void;
  listenConfig: () => void;
  setConfig: (partialConfig: object) => void;
  validate: (deviceConf: DeviceDefinition) => string | undefined;
}
