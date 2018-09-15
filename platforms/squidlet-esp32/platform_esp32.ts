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

    'I2cSlave',
    'Adc',
    'Dac',
    'Touch',
  ],

  hostConfig: {
    config: {

    }
  }
};

export default platformConfig;
