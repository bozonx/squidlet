import IoItem from '../IoItem';


export const Methods = [
  'isConnected',
  'publish',
  'subscribe',
  'onMessage',
  'onMessageBin',
];


export default interface MqttIo extends IoItem {
  isConnected(): Promise<boolean>;
  publish(topic: string, data: string | Uint8Array | undefined): Promise<void>;
  subscribe(topic: string): Promise<void>;
  onMessage(handler: (topic: string, data: string) => void): Promise<void>;
  onMessageBin(): Promise<void>;
}
