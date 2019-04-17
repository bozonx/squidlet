import WifiDev, {WifiParams} from '../../system/interfaces/dev/WifiDev';


export default class Wifi implements WifiDev {

  async configure(params: WifiParams): Promise<void> {
    // TODO: set params
  }

}
