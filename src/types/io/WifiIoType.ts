export interface WifiParams {
  ssid?: string
  password?: string
}


export default interface WifiIoType {
  setConnection(params: WifiParams): Promise<void>
}
