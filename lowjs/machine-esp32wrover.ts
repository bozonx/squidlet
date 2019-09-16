import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';


const machineConfig: MachineConfig = {
  ios: [
    './ios/Mqtt.ts',
    './nodejs/ios/Storage.ts',
    './nodejs/ios/WebSocketClient.ts',
    './nodejs/ios/WebSocketServer.ts',
    './ios/Sys.ts',
    './nodejs/ios/HttpClient.ts',
    './nodejs/ios/HttpServer.ts',

    './ios/Digital.ts',
    './ios/I2cMaster.ts',
    './ios/Serial',

    //'Pwm',
    //'Spi',
    //'./ios/Wifi',
    //'Bluetooth',

    //'Adc',
    //'Dac',
    //'I2cSlave',
  ],
  // iosSupportFiles: [
  //   '../shared/nodejs/helpers.js',
  // ],

  hostConfig: {
    drivers: {
      'I2cMaster': {
        bus: 1,
      }
    },

  }
};

export default machineConfig;
