import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';


const machineConfig: MachineConfig = {
  devs: [
    './devs/Storage',
    //'Sha1',
    './devs/Digital',
    //'Pwm',
    //'Serial',
    //'Spi',
    //'Wifi',
    //'Bluetooth',
    './devs/I2cMaster',

    './devs/Mqtt',

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
