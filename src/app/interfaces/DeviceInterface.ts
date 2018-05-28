export default interface Device {
  listenStatus: () => void;
  listenConfig: () => void;
  setConfig: (partialConfig: object) => void;
}
