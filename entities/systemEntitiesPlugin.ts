import * as path from 'path';
import PluginEnv from '../hostEnvBuilder/entities/PluginEnv';

const systemEntitiesRoot = '../entities';
const devicesRoot = path.resolve(__dirname, systemEntitiesRoot, 'devices');
const driversRoot = path.resolve(__dirname, systemEntitiesRoot, 'drivers');
const servicesRoot = path.resolve(__dirname, systemEntitiesRoot, 'services');
//const networkConnectionDriversRoot = path.resolve(__dirname, systemEntitiesRoot, 'network/connections');


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
  await env.addDriver(path.join(driversRoot, 'Binary/BinaryInput.yaml'));
  await env.addDriver(path.join(driversRoot, 'Binary/BinaryOutput.yaml'));
  await env.addDriver(path.join(driversRoot, 'Binary/ImpulseInput.yaml'));
  await env.addDriver(path.join(driversRoot, 'Binary/ImpulseOutput.yaml'));
  await env.addDriver(path.join(driversRoot, 'Binary/BinaryClick.yaml'));
  await env.addDriver(path.join(driversRoot, 'DigitalPin/DigitalPinInput.yaml'));
  await env.addDriver(path.join(driversRoot, 'DigitalPin/DigitalPinOutput.yaml'));
  await env.addDriver(path.join(driversRoot, 'I2cData/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'I2cMaster/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'I2cToSlave/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'I2cSlave/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'I2cToMaster/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'I2cDuplex/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'Serial/SerialDuplex.yaml'));
  await env.addDriver(path.join(driversRoot, 'DigitalPin/Digital_local.yaml'));
  await env.addDriver(path.join(driversRoot, 'DigitalPin/Digital_pcf8574.yaml'));
  await env.addDriver(path.join(driversRoot, 'DigitalPin/Digital_portExpander.yaml'));
  await env.addDriver(path.join(driversRoot, 'Pcf8574/manifest.yaml'));
  await env.addDriver(path.join(driversRoot, 'PortExpander/manifest.yaml'));

  // network connections drivers
  //await env.addDriver(path.join(networkConnectionDriversRoot, 'I2c.connection'));

  // services
  await env.addService(path.join(servicesRoot, 'Mqtt/manifest.yaml'));
  await env.addService(path.join(servicesRoot, 'Logger/manifest.yaml'));
}
