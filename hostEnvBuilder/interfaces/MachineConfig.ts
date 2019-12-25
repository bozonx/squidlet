import PreHostConfig from './PreHostConfig';


export default interface MachineConfig {
  ios: {[index: string]: string};
  //iosSupportFiles?: string[];
  hostConfig: PreHostConfig;
}
