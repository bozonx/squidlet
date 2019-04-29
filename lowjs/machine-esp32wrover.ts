import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';


const machineConfig: MachineConfig = {
  devs: [
    '../shared/nodeJsLikeIo/Storage.ts',
    '../shared/nodeJsLikeIo/WebSocketClient.js',
    '../shared/nodeJsLikeIo/WebSocketServer.ts',
    //'Sha1',
    './devs/Digital.ts',
    //'Pwm',
    //'Serial',
    //'Spi',
    './devs/Wifi',
    //'Bluetooth',
    './devs/I2cMaster.ts',

    //'Mqtt',

    //'Adc',
    //'Dac',
    //'I2cSlave',
  ],
  devsSupportFiles: [
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
