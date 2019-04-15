import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';


const machineConfig: MachineConfig = {
  devs: [
    './devs/Storage.ts',
    //'Sha1',
    './devs/Digital.ts',
    //'Pwm',
    //'Serial',
    //'Spi',
    //'Wifi',
    //'Bluetooth',
    './devs/I2cMaster.ts',

    './devs/Mqtt.ts',

    //'Adc',
    //'Dac',
    //'I2cSlave',
  ],

  hostConfig: {
    // config: {
    //   varDataDir: '~/.squidlet/data',
    //   envSetDir: '~/.squidlet/envSet',
    // },
    drivers: {
      'I2cMaster': {
        bus: 1,
      }
    },

  }
};

export default machineConfig;
