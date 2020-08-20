export const servicesShortcut: {[index: string]: string} = {
  automation: 'Automation',
  network: 'Network',
  wsApi: 'WsApi',
  httpApi: 'HttpApi',
  updater: 'Updater',
  ioServer: 'IoServer',
  // TODO: неправильно так как для него нет props,
  //       но по другому не будет работать в defaultServices
  sharedStorage: 'SharedStorage',
};

// services which set by default even you don't specify it in host config.
// To turn off the service you should specify: logger: false.
export const defaultServices = [
  'sharedStorage',
  //'ioServer',
  //'updater',
  //'httpApi',
];
