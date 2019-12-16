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
    //'./ios/Serial.ts',
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
      Digital: {
        host: 'localhost'
      },
    },
    // dependencies: {
    //   //'i2c-bus': '*',
    //   'pigpio': '*',
    // },
  }
};

export default machineConfig;
