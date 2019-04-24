import WifiDev, {WifiParams} from 'system/interfaces/io/WifiDev';


export default class Wifi implements WifiDev {

  async configure(params: WifiParams): Promise<void> {
    // TODO: set params
  }

}
