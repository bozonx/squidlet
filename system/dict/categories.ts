export default {
  system: 'system',
  // mqttIncome: 'mqttIncome',
  // mqttOutcome: 'mqttOutcome',
  // messengerRequestResponse: 'messengerRequestResponse',
  // messengerBridge: 'messengerBridge',
  //devicesChannel: 'devicesChannel',
  // devices publish to this category, topic is deviceId
  externalDataOutcome: 'externalDataOutcome',
  // data from mqtt or backend moves to this category
  externalDataIncome: 'externalDataIncome',
  // all the logs. Topic is level
  logger: 'logger',
  // updater service
  updater: 'updater',
  // IoSet service works via this category. Doesn't have topics
  ioSet: 'ioSet',
};
