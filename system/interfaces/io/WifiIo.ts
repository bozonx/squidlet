import IoItem from '../IoItem';
import IoManager from '../../managers/IoManager';


export interface WifiParams {
  ssid?: string;
  password?: string;
}


export const Methods = [
  'init',
];


export default interface WifiIo extends IoItem {
  init(ioManager: IoManager, params: WifiParams): Promise<void>;
}
