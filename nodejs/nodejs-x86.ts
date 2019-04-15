import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';


const machineConfig: MachineConfig = {
  devs: [
    '../shared/nodeJsLike/Storage.ts',
    //'Sha1',
    //'Serial',
    //'Wifi',
    //'Bluetooth',

    './devs/Mqtt.ts',
  ],
  devsSupportFiles: [
    './x86/package.json',
    '../shared/nodeJsLike/helpers.js',
  ],

  hostConfig: {
    config: {
      varDataDir: '~/.squidlet/data',
      envSetDir: '~/.squidlet/envSet',
    },
    drivers: {
      'I2cMaster': {
        bus: 1,
      }
    },

  }
};

export default machineConfig;
