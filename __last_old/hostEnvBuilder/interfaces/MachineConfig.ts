import PreHostConfig from './PreHostConfig';


export default interface MachineConfig {
  ios: {[index: string]: string};
  hostConfig: PreHostConfig;
}
