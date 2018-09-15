import PlatformConfig from '../../configWorks/interfaces/PlatformConfig';


const platformConfig: PlatformConfig = {
  devs: [
    'Fs',
    'Gpio',
    'Pwm',
    'Serial',
    'Spi',
    'Wifi',
    'Bluetooth',
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
