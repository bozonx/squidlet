import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';


const machineConfig: MachineConfig = {
  ios: [
    './ios/Mqtt.ts',
    './ios/Storage.ts',
    './ios/WebSocketClient.ts',
    './ios/WebSocketServer.ts',
    './ios/Sys.ts',

    './ios/Digital.ts',
    './ios/I2cMaster.ts',
    //'I2cSlave',
    //'Pwm',
    //'Serial',
    //'Spi',
    //'Wifi',
    //'Bluetooth',
    //'Adc',
    //'Dac',
  ],
  // iosSupportFiles: [
  //   './ios/helpers.js',
  // ],

  hostConfig: {
    drivers: {
      'I2cMaster': {
        bus: 1,
      }
    },
    dependencies: {
      'i2c-bus': '^4.0.9',
      'pigpio': '^1.2.2',
    },
  }
};

export default machineConfig;
