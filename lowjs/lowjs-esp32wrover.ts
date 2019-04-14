import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';


const machineConfig: MachineConfig = {
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
    config: {
      varDataDir: '/varData',
      envSetDir: '/envSet',
    },
    drivers: {
      'I2cMaster': {
        bus: 1,
      }
    },

  }
};

export default machineConfig;
