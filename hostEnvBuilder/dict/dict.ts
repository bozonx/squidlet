export const servicesShortcut: {[index: string]: string} = {
  automation: 'Automation',
  consoleLogger: 'ConsoleLogger',
  ioSetServer: 'IoSetServer',
  updater: 'Updater',

  mqtt: 'Mqtt',
  backdoor: 'Backdoor',
};

// services which set by default event you don't specify it in host config.
// To turn off the service you should specify: logger: null or backdoor: null.
export const defaultServices = [
  //'automation',
  'consoleLogger',
  'ioSetServer',
  //'updater',
];
