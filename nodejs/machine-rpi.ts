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
  iosSupportFiles: [
    './ios/helpers.js',
  ],

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
