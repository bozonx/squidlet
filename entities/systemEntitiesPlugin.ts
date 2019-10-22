import * as path from 'path';
import PluginEnv from '../hostEnvBuilder/entities/PluginEnv';
import {makeListOfNamesFromPaths} from '../shared/helpers';

const systemEntitiesRoot = '../entities';
const devicesRoot = path.resolve(__dirname, systemEntitiesRoot, 'devices');
const driversRoot = path.resolve(__dirname, systemEntitiesRoot, 'drivers');
const servicesRoot = path.resolve(__dirname, systemEntitiesRoot, 'services');


export default async function systemEntitiesPlugin (env: PluginEnv) {
  // devices
  await env.addDevice(path.join(devicesRoot, 'BinarySensor/manifest.yaml'));
  await env.addDevice(path.join(devicesRoot, 'BinaryState/manifest.yaml'));
  await env.addDevice(path.join(devicesRoot, 'ClickSensor/manifest.yaml'));
  await env.addDevice(path.join(devicesRoot, 'GpioLocal/manifest.yaml'));
  await env.addDevice(path.join(devicesRoot, 'GpioPcf8574/manifest.yaml'));
  await env.addDevice(path.join(devicesRoot, 'Relay/manifest.yaml'));
  await env.addDevice(path.join(devicesRoot, 'Switch/manifest.yaml'));
  await env.addDevice(path.join(devicesRoot, 'Toggle/manifest.yaml'));
  await env.addDevice(path.join(devicesRoot, 'WallSwitchSensor/manifest.yaml'));
  await env.addDevice(path.join(devicesRoot, 'WallToggle/manifest.yaml'));

  // drivers
  await env.addDriver(path.join(driversRoot, 'BinaryClick/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'BinaryInput/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'BinaryOutput/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'HttpClient/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'HttpServer/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'HttpServerRouter/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'I2cData/manifest.yaml'));
  //await env.addDriver(path.join(driversRoot, 'I2cDuplex/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'I2cMaster/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'I2cSlave/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'I2cToMaster/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'I2cToSlave/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'ImpulseInput/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'ImpulseOutput/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'Mqtt/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'Pcf8574/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'Serial/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'SerialDuplex/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'SharedStorage/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'WsClient/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'WsServer/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'WsServerSessions/manifest.yaml'));

  // services
  await env.addService(path.join(servicesRoot, 'Automation/manifest.yaml'));
  await env.addService(path.join(servicesRoot, 'HttpApi/manifest.yaml'));
  await env.addService(path.join(servicesRoot, 'MqttApi/manifest.yaml'));
  await env.addService(path.join(servicesRoot, 'MqttApiTopics/manifest.yaml'));
  await env.addService(path.join(servicesRoot, 'Updater/manifest.yaml'));
  await env.addService(path.join(servicesRoot, 'WsApi/manifest.yaml'));

  // add used on host drivers related on ios
  env.afterRegistering(async () => {
    const machineIos: string[] = makeListOfNamesFromPaths(env.getMachineConfig().ios);

    if (machineIos.includes('Digital')) {
      await env.addUsedEntity('driver', 'Digital_local');
    }

    // if (machineIos.includes('Serial')) {
    //   await env.addUsedEntity('driver', 'SerialDuplex');
    // }

    if (machineIos.includes('I2cMaster')) {
      //await env.addUsedEntity('drivers', 'I2cMaster');
      await env.addUsedEntity('driver', 'I2cToSlave');
      //await env.addUsedEntity('driver', 'I2cDuplex');
    }

    if (machineIos.includes('I2cSlave')) {
      //await env.addUsedEntity('drivers', 'I2cSlave');
      await env.addUsedEntity('driver', 'I2cToMaster');
      //await env.addUsedEntity('driver', 'I2cDuplex');
    }
  });
}
