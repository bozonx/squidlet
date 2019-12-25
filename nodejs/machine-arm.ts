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

    //'./ios/Serial.ts',
    //'Wifi',
    //'Bluetooth',
  },
  // iosSupportFiles: [
  //   './ios/helpers.js',
  // ],

  hostConfig: {
  }
};

export default machineConfig;
