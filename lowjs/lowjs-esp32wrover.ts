import PlatformConfig from '../buildHostEnv/interfaces/PlatformConfig';


const platformConfig: PlatformConfig = {
  devs: [
    //'Storage.dev',
    //'Sys.dev',
    //'Sha1',
    'Digital.dev',
    //'Pwm.dev',
    //'Serial.dev',
    //'Spi.dev',
    //'Wifi.dev',
    //'Bluetooth.dev',
    //'I2cMaster.dev',

    //'Mqtt.dev',

    //'Adc.dev',
    //'Dac.dev',
    //'I2cSlave.dev',
  ],

  hostConfig: {
    config: {
    },
    drivers: {
      'I2cMaster.driver': {
        bus: 1,
      }
    },

  }
};

export default platformConfig;
