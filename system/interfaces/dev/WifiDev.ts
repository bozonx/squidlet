export interface WifiParams {
  ssid?: string;
  password?: string;
}

export default interface WifiDev {
  configure(params: WifiParams): Promise<void>;
}
