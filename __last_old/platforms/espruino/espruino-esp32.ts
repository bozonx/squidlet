import MachineConfig from '../../hostEnvBuilder/interfaces/MachineConfig';


const machineConfig: MachineConfig = {
  ios: [
    'Storage',
    'Sys',
    'Sha1',
    'Digital',
    //'Pwm',
    'Serial',
    //'Spi',
    //'Wifi',
    //'Bluetooth',
    'I2cMaster',

    //'I2cSlave',
    //'Adc',
    //'Dac',
    //'Touch',
  ],

  hostConfig: {
    config: {

    }
  }
};

export default machineConfig;
