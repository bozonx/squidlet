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

    'Adc',
    //'I2cSlave',
  ],

  hostConfig: {
    config: {

    }
  }
};

export default platformConfig;
