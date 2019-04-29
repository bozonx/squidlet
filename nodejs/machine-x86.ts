import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';


const machineConfig: MachineConfig = {
  devs: [
    './devs/Mqtt.ts',
    '../shared/nodeJsLikeIo/Storage.ts',
    '../shared/nodeJsLikeIo/WebSocketClient.ts',
    '../shared/nodeJsLikeIo/WebSocketServer.ts',
    //'Sha1',
    //'Serial',
    //'Wifi',
    //'Bluetooth',
  ],
  devsSupportFiles: [
    './x86/package.json',
    '../shared/nodeJsLikeIo/helpers.js',
  ],

  hostConfig: {
  }
};

export default machineConfig;
