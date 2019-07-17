import * as path from 'path';
import PluginEnv from '../hostEnvBuilder/entities/PluginEnv';
import {makeIoNames} from '../shared/helpers';

const systemEntitiesRoot = '../entities';
const devicesRoot = path.resolve(__dirname, systemEntitiesRoot, 'devices');
const driversRoot = path.resolve(__dirname, systemEntitiesRoot, 'drivers');
const servicesRoot = path.resolve(__dirname, systemEntitiesRoot, 'services');


export default async function systemEntitiesPlugin (env: PluginEnv) {
  // devices
  await env.addDevice(path.join(devicesRoot, 'ClickSensor/manifest.yaml'));
  await env.addDevice(path.join(devicesRoot, 'BinarySensor/manifest.yaml'));
  await env.addDevice(path.join(devicesRoot, 'Toggle/manifest.yaml'));
  await env.addDevice(path.join(devicesRoot, 'Relay/manifest.yaml'));
  await env.addDevice(path.join(devicesRoot, 'Switch/manifest.yaml'));
  await env.addDevice(path.join(devicesRoot, 'WallClickSensor/manifest.yaml'));
  await env.addDevice(path.join(devicesRoot, 'WallSwitchSensor/manifest.yaml'));
  await env.addDevice(path.join(devicesRoot, 'WallToggle/manifest.yaml'));
  await env.addDevice(path.join(devicesRoot, 'Pcf8574/manifest.yaml'));
  await env.addDevice(path.join(devicesRoot, 'PortExpanderEsp32/manifest.yaml'));
  // TODO: remove
  await env.addDevice(path.join(devicesRoot, 'FakePeopleCount/manifest.yaml'));

  // drivers
  await env.addDriver(path.join(driversRoot, 'BinaryClick/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'BinaryInput/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'BinaryOutput/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'ImpulseInput/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'ImpulseOutput/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'DigitalPinInput/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'DigitalPinOutput/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'Digital_local/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'Digital_pcf8574/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'Digital_portExpander/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'I2cData/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'I2cMaster/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'I2cToSlave/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'I2cSlave/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'I2cToMaster/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'I2cDuplex/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'Mqtt/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'SerialDuplex/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'Pcf8574/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'PortExpander/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'SharedStorage/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'WsClient/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'WsServer/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'WsServerSessions/manifest.yaml'));

  // services
  await env.addService(path.join(servicesRoot, 'Backdoor/manifest.yaml'));
  await env.addService(path.join(servicesRoot, 'ConsoleLogger/manifest.yaml'));
  await env.addService(path.join(servicesRoot, 'MqttApi/manifest.yaml'));
  await env.addService(path.join(servicesRoot, 'MqttApiTopics/manifest.yaml'));
  await env.addService(path.join(servicesRoot, 'Updater/manifest.yaml'));
  await env.addService(path.join(servicesRoot, 'WsApi/manifest.yaml'));

  // add used on host drivers related on ios
  env.afterRegistering(async () => {
    const machineIos: string[] = makeIoNames(env.getMachineConfig().ios);

    if (machineIos.includes('Digital')) {
      await env.addUsedEntity('drivers', 'Digital_local');
    }

    if (machineIos.includes('Serial')) {
      await env.addUsedEntity('drivers', 'SerialDuplex');
    }

    if (machineIos.includes('I2cMaster')) {
      //await env.addUsedEntity('drivers', 'I2cMaster');
      await env.addUsedEntity('drivers', 'I2cToSlave');
      await env.addUsedEntity('drivers', 'I2cDuplex');
    }

    if (machineIos.includes('I2cSlave')) {
      //await env.addUsedEntity('drivers', 'I2cSlave');
      await env.addUsedEntity('drivers', 'I2cToMaster');
      await env.addUsedEntity('drivers', 'I2cDuplex');
    }
  });
}
