export interface WifiParams {
  ssid?: string;
  password?: string;
}


export const WifiMethods = [
  'configure',
];


export default interface WifiDev {
  configure(params: WifiParams): Promise<void>;
}
