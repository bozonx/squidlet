import PlatformConfig from '../../squidlet-starter/build-host-env/interfaces/PlatformConfig';


const platformConfig: PlatformConfig = {
  devs: [
    'Storage.dev',
    'Sys.dev',
    'Digital.dev',
    //'Pwm.dev',
    'Serial.dev',
    //'Spi.dev',
    //'Wifi.dev',
    //'Bluetooth.dev',
    'I2cMaster.dev',

    'Adc.dev',
    //'I2cSlave.dev',
  ],

  hostConfig: {
    config: {

    }
  }
};

export default platformConfig;
