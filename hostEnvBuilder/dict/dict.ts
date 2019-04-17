export const servicesShortcut: {[index: string]: string} = {
  automation: 'Automation',
  mqtt: 'Mqtt',
  logger: 'Logger',
  backdoor: 'BackDoor',
  updater: 'Updater',
};

// services which set by default event you don't specify it in host config.
// To turn off the service you should specify: logger: null or backdoor: null.
export const defaultServices = [
  'logger',
  // 'backdoor',
  // 'updater',
];
