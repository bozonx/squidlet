export const servicesShortcut: {[index: string]: string} = {
  automation: 'Automation',
  consoleLogger: 'ConsoleLogger',
  //updater: 'Updater',
  mqttApi: 'MqttApi',
  wsApi: 'WsApi',
};

// services which set by default event you don't specify it in host config.
// To turn off the service you should specify: logger: null.
export const defaultServices = [
  //'automation',
  'consoleLogger',
  //'updater',
  'wsApi',
];
