import PlatformConfig from '../../configWorks/interfaces/PlatformConfig';


const platformConfig: PlatformConfig = {
  devs: [
    'Fs.dev',
    'Digital.dev',
    //'Pwm.dev',
    'Serial.dev',
    //'Spi.dev',
    //'Wifi.dev',
    //'Bluetooth.dev',
    'I2cMaster.dev',

    //'Adc.dev',
    //'Dac.dev',
    //'I2cSlave.dev',
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
