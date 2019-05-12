import PreHostConfig from './PreHostConfig';


export default interface MachineConfig {
  ios: string[];
  iosSupportFiles?: string[];
  hostConfig: PreHostConfig;
}
