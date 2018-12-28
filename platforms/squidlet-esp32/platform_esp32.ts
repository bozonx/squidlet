import PlatformConfig from '../../squidlet-starter/build-host-env/interfaces/PlatformConfig';


const platformConfig: PlatformConfig = {
  devs: [
    'Storage.dev',
    'Sys.dev',
    'Sha1',
    'Digital.dev',
    //'Pwm.dev',
    'Serial.dev',
    //'Spi.dev',
    //'Wifi.dev',
    //'Bluetooth.dev',
    'I2cMaster.dev',

    //'I2cSlave.dev',
    //'Adc.dev',
    //'Dac.dev',
    //'Touch.dev',
  ],

  hostConfig: {
    config: {

    }
  }
};

export default platformConfig;
