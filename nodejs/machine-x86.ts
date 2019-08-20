import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';


const machineConfig: MachineConfig = {
  ios: [
    './ios/Mqtt.ts',
    './ios/Storage.ts',
    './ios/WebSocketClient.ts',
    './ios/WebSocketServer.ts',
    './ios/Sys.ts',
    //'Serial',
    //'Wifi',
    //'Bluetooth',
  ],
  // iosSupportFiles: [
  //   './ios/helpers.js',
  // ],

  hostConfig: {
  }
};

export default machineConfig;
