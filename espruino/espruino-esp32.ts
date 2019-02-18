import PlatformConfig from '../buildHostEnv/interfaces/PlatformConfig';


const platformConfig: PlatformConfig = {
  devs: [
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

export default platformConfig;
