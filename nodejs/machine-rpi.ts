import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';


const machineConfig: MachineConfig = {
  ios: [
    './ios/Mqtt.ts',
    './ios/Storage.ts',
    './ios/WebSocketClient.ts',
    './ios/WebSocketServer.ts',
    './ios/Sys.ts',
    './ios/HttpClient.ts',
    './ios/HttpServer.ts',

    './ios/Digital.ts',
    './ios/Serial.ts',
    './ios/I2cMaster.ts',
    //'I2cSlave',
    //'Pwm',
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
    ios: {
      I2cMaster: {
        buses: {
          0: {
            bus: 1,
          }
        }
      },
    },
    dependencies: {
      'i2c-bus': '^4.0.10',
      'pigpio': '^1.2.3',
    },
  }
};

export default machineConfig;
