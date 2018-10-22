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
