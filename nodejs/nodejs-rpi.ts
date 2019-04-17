import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';


const machineConfig: MachineConfig = {
  devs: [
    '../shared/nodeJsLike/Storage.ts',
    '../shared/nodeJsLike/WebSocketClient.js',
    '../shared/nodeJsLike/WebSocketServer.js',
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
    '../shared/nodeJsLike/helpers.js',
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
