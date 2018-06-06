import DeviceConf from "./DeviceConf";

export default interface Device {
  init: () => Promise<void>;
  listenStatus: () => void;
  listenConfig: () => void;
  setConfig: (partialConfig: object) => void;
  validate: (deviceConf: DeviceConf) => string | undefined;
}
