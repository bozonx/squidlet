import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';


const machineConfig: MachineConfig = {
  ios: [
    '../shared/nodeJsLikeIo/Storage.ts',
    '../shared/nodeJsLikeIo/WebSocketClient.js',
    '../shared/nodeJsLikeIo/WebSocketServer.ts',
    //'Sha1',
    './ios/Digital.ts',
    //'Pwm',
    //'Serial',
    //'Spi',
    './ios/Wifi',
    //'Bluetooth',
    './ios/I2cMaster.ts',

    //'Mqtt',

    //'Adc',
    //'Dac',
    //'I2cSlave',
  ],
  iosSupportFiles: [
    '../shared/nodeJsLikeIo/helpers.js',
  ],

  hostConfig: {
    drivers: {
      'I2cMaster': {
        bus: 1,
      }
    },

  }
};

export default machineConfig;
