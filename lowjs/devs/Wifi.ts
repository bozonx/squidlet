import WifiIo, {WifiParams} from 'system/interfaces/io/WifiIo';


export default class Wifi implements WifiIo {

  async configure(params: WifiParams): Promise<void> {
    // TODO: set params
  }

}
