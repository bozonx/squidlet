import IoItem from '../IoItem';


export interface WifiParams {
  ssid?: string;
  password?: string;
}


export const Methods = [
  'configure',
];


export default interface WifiIo extends IoItem {
  configure(params: WifiParams): Promise<void>;
}
