import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';


const machineConfig: MachineConfig = {
  devs: [
    '../shared/nodeJsLikeIo/Storage.ts',
    '../shared/nodeJsLikeIo/WebSocketClient.ts',
    '../shared/nodeJsLikeIo/WebSocketServer.ts',
    //'Sha1',
    './devs/Digital.ts',
    //'Pwm',
    //'Serial',
    //'Spi',
    //'Wifi',
    //'Bluetooth',
    './devs/I2cMaster.ts',

    './devs/Mqtt.ts',

    //'Adc',
    //'Dac',
    //'I2cSlave',
  ],
  devsSupportFiles: [
    './rpi/package.json',
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
