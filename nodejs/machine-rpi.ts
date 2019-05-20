import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';


const machineConfig: MachineConfig = {
  ios: [
    './ios/Storage.ts',
    './ios/WebSocketClient.ts',
    './ios/WebSocketServer.ts',
    //'Sha1',
    './ios/Digital.ts',
    //'Pwm',
    //'Serial',
    //'Spi',
    //'Wifi',
    //'Bluetooth',
    './ios/I2cMaster.ts',

    './ios/Mqtt.ts',

    //'Adc',
    //'Dac',
    //'I2cSlave',
  ],
  // iosSupportFiles: [
  //   //'./rpi/package.json',
  //   '../shared/nodeJsLikeIo/helpers.js',
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
