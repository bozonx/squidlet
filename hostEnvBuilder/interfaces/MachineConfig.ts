import PreHostConfig from './PreHostConfig';


export default interface MachineConfig {
  devs: string[];
  devsSupportFiles?: string[];
  hostConfig: PreHostConfig;
}
