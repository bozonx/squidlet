export default interface Device {
  init: () => Promise<void>;
  listenStatus: () => void;
  listenConfig: () => void;
  setConfig: (partialConfig: object) => void;
}
