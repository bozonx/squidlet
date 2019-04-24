export interface WifiParams {
  ssid?: string;
  password?: string;
}


export const Methods = [
  'configure',
];


export default interface WifiIo {
  configure(params: WifiParams): Promise<void>;
}
