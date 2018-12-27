import PlatformConfig from '../../configWorks/interfaces/PlatformConfig';


const platformConfig: PlatformConfig = {
  devs: [
    'Storage.dev',
    'Sys.dev',
    //'Sha1',
    'Digital.dev',
    //'Pwm.dev',
    'Serial.dev',
    //'Spi.dev',
    //'Wifi.dev',
    //'Bluetooth.dev',
    'I2cMaster.dev',

    'Mqtt.dev',

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
    },
    drivers: {
      'I2cMaster.driver': {
        bus: 1,
      }
    },

  }
};

export default platformConfig;
