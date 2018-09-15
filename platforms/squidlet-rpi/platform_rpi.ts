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

    //'Adc',
    //'Dac',
    //'I2cSlave',
  ],

  hostConfig: {
    config: {
      // TODO: review
      // connections: {
      //   i2c: {
      //     bus: 1,
      //   }
      // },
    }
  }
};

export default platformConfig;
