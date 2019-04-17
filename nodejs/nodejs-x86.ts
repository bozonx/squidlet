import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';


const machineConfig: MachineConfig = {
  devs: [
    './devs/Mqtt.ts',
    '../shared/nodeJsLike/Storage.ts',
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
