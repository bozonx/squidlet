import HostConfig from '../host/src/app/interfaces/HostConfig';


export default class ParseMasterConfig {
  constructor(fullConfig: {[index: string]: any}) {

  }

  // TODO: return type HostConfig
  getHostConfig(hostId: string): any {
    // TODO: do it
    return {};
  }

  // /**
  //  * Parse config
  //  */
  // parse(): {[index: string]: HostConfig} {
  //   // TODO: do it
  //   return {};
  // }

  destroy() {
    // TODO: remove configs
  }

}
