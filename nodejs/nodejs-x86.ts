import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';


const machineConfig: MachineConfig = {
  devs: [
    './devs/Storage.ts',
    //'Sha1',
    //'Serial',
    //'Wifi',
    //'Bluetooth',

    './devs/Mqtt.ts',
  ],
  devsSupportFiles: [
    './x86/package.json',
    '../shared/nodeJsLike/helper.js',
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
