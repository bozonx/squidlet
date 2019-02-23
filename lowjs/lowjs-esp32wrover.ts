import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';


const platformConfig: MachineConfig = {
  devs: [
    //'Storage',
    //'Sha1',
    'Digital',
    //'Pwm',
    //'Serial',
    //'Spi',
    //'Wifi',
    //'Bluetooth',
    'I2cMaster',

    //'Mqtt',

    //'Adc',
    //'Dac',
    //'I2cSlave',
  ],

  hostConfig: {
    defaultVarDataDir: '/varData',
    defaultEnvSetDir: '/envSet',
    config: {
    },
    drivers: {
      'I2cMaster': {
        bus: 1,
      }
    },

  }
};

export default platformConfig;
