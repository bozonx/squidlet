import PlatformConfig from '../../squidlet-starter/buildHostEnv/interfaces/PlatformConfig';


const platformConfig: PlatformConfig = {
  devs: [
    'Storage.dev',
    'Sys.dev',
    //'Wifi.dev',
    //'Bluetooth.dev',

    // via usb
    //'Digital.dev',
    //'Serial.dev',
    //'I2cMaster.dev',

    //'I2cSlave.dev',
    //'Adc.dev',
    //'Dac.dev',
  ],

  hostConfig: {
    config: {

    }
  }
};

export default platformConfig;
