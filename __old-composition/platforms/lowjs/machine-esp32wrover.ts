import MachineConfig from '../../hostEnvBuilder/interfaces/MachineConfig';


const machineConfig: MachineConfig = {
  ios: [
    './ios/Mqtt.ts',
    '../nodejs/ios/Storage.ts',
    '../nodejs/ios/WebSocketClient.ts',
    '../nodejs/ios/WebSocketServer.ts',
    './ios/Sys.ts',
    '../nodejs/ios/HttpClient.ts',
    '../nodejs/ios/HttpServer.ts',

    './ios/DigitalInput.ts',
    './ios/DigitalOutput.ts',
    './ios/I2cMaster.ts',
    './ios/Serial.ts',

    //'Pwm',
    //'Spi',
    //'./ios/Wifi',
    //'Bluetooth',

    //'Adc',
    //'Dac',
    //'I2cSlave',
  ],


  hostConfig: {
    ios: {
      I2cMaster: {
        buses: {
          0: {
            pinSDA: 4,
            pinSCL: 5,
            clockHz: 100000,
          }
        }
      },
    },
  },
};

export default machineConfig;
