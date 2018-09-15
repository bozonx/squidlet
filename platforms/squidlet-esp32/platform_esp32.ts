import PlatformConfig from '../../configWorks/interfaces/PlatformConfig';


const platformConfig: PlatformConfig = {
  devs: [
    'Fs',
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
