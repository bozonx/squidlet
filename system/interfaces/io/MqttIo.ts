export const Methods = [
  'isConnected',
  'publish',
  'subscribe',
  'onMessage',
  'onMessageBin',
];


export default interface MqttIo {
  isConnected(): boolean;
  publish(topic: string, data: string | Uint8Array | undefined): Promise<void>;
  subscribe(topic: string): Promise<void>;
  onMessage(handler: (topic: string, data: string) => void): void;
  onMessageBin(): void;
}