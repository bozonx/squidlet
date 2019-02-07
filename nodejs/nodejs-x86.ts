import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';


const platformConfig: MachineConfig = {
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
    defaultBuildDir: '~/.squidlet/build',
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
