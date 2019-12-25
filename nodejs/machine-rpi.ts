import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';


const machineConfig: MachineConfig = {
  ios: {
    Mqtt: './ios/Mqtt.ts',
    Storage: './ios/Storage.ts',
    WebSocketClient: './ios/WebSocketClient.ts',
    WebSocketServer: './ios/WebSocketServer.ts',
    Sys: './ios/Sys.ts',
    HttpClient: './ios/HttpClient.ts',
    HttpServer: './ios/HttpServer.ts',

    Digital: './ios/Digital.ts',
    //'./ios/Serial.ts',
    I2cMaster: './ios/I2cMaster.ts',
    //'I2cSlave',
    //'Pwm',
    //'Spi',
    //'Wifi',
    //'Bluetooth',
    //'Adc',
    //'Dac',
  },
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
      PigpioClient: {
        host: 'localhost'
      },
    },
  }
};

export default machineConfig;
