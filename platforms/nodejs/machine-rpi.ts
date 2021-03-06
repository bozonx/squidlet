import MachineConfig from '../../hostEnvBuilder/interfaces/MachineConfig';


const machineConfig: MachineConfig = {
  ios: {
    Sys: './ios/Sys.ts',
    Storage: './ios/Storage.ts',
    Mqtt: './ios/Mqtt.ts',
    WebSocketClient: './ios/WebSocketClient.ts',
    WebSocketServer: './ios/WebSocketServer.ts',
    HttpClient: './ios/HttpClient.ts',
    HttpServer: './ios/HttpServer.ts',

    PigpioClient: './ios/PigpioClient.ts',
    Digital: './ios/Digital.ts',
    //Serial: './ios/Serial.ts',
    I2cMaster: './ios/I2cMaster.ts',
    //'Pwm',
    //'Spi',
    //'Adc',
    //'Dac',
    //'Wifi',
    //'Bluetooth',
  },


  hostConfig: {
    ios: {
      I2cMaster: {
        defaultBus: 1,
      },
      PigpioClient: {
        host: 'localhost'
      },
    },
  }
};

export default machineConfig;
