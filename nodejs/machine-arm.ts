import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';


const machineConfig: MachineConfig = {
  devs: [
    './devs/Mqtt.ts',
    '../shared/nodeJsLike/Storage.ts',
    '../shared/nodeJsLike/WebSocketClient.ts',
    '../shared/nodeJsLike/WebSocketServer.ts',
    //'Sha1',
    //'Serial',
    //'Wifi',
    //'Bluetooth',
  ],
  devsSupportFiles: [
    './x86/package.json',
    '../shared/nodeJsLike/helpers.js',
  ],

  hostConfig: {
  }
};

export default machineConfig;