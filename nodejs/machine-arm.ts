import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';


const machineConfig: MachineConfig = {
  ios: [
    './ios/Mqtt.ts',
    '../shared/nodeJsLikeIo/Storage.ts',
    '../shared/nodeJsLikeIo/WebSocketClient.ts',
    '../shared/nodeJsLikeIo/WebSocketServer.ts',
    //'Sha1',
    //'Serial',
    //'Wifi',
    //'Bluetooth',
  ],
  iosSupportFiles: [
    //'./x86/package.json',
    '../shared/nodeJsLikeIo/helpers.js',
  ],

  hostConfig: {
  }
};

export default machineConfig;
