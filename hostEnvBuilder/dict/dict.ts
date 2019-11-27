export const servicesShortcut: {[index: string]: string} = {
  automation: 'Automation',
  mqttApi: 'MqttApi',
  wsApi: 'WsApi',
  httpApi: 'HttpApi',
  updater: 'Updater',
};

// services which set by default event you don't specify it in host config.
// To turn off the service you should specify: logger: false.
export const defaultServices = [
  //'updater',
  //'httpApi',
];
