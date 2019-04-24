export interface WifiParams {
  ssid?: string;
  password?: string;
}


export const Methods = [
  'configure',
];


export default interface WifiDev {
  configure(params: WifiParams): Promise<void>;
}
