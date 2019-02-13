import * as path from 'path';
import PluginEnv from './entities/PluginEnv';

const systemEntitiesRoot = '../entities';
const devicesRoot = path.resolve(__dirname, systemEntitiesRoot, 'devices');
const driversRoot = path.resolve(__dirname, systemEntitiesRoot, 'drivers');
const servicesRoot = path.resolve(__dirname, systemEntitiesRoot, 'services');
//const networkConnectionDriversRoot = path.resolve(__dirname, systemEntitiesRoot, 'network/connections');


export default async function systemPlugin (env: PluginEnv) {
  // devices
  await env.addDevice(path.join(devicesRoot, 'ClickSensor/manifest.yaml'));
  await env.addDevice(path.join(devicesRoot, 'BinarySensor/manifest.yaml'));
  await env.addDevice(path.join(devicesRoot, 'Toggle/manifest.yaml'));
  await env.addDevice(path.join(devicesRoot, 'Relay/manifest.yaml'));
  await env.addDevice(path.join(devicesRoot, 'Switch/manifest.yaml'));
  await env.addDevice(path.join(devicesRoot, 'WallClickSensor/manifest.yaml'));
  await env.addDevice(path.join(devicesRoot, 'WallSwitchSensor/manifest.yaml'));
  await env.addDevice(path.join(devicesRoot, 'WallToggle/manifest.yaml'));
  // TODO: remove
  await env.addDevice(path.join(devicesRoot, 'FakePeopleCount/manifest.yaml'));
  // TODO: remove
  await env.addDevice(path.join(devicesRoot, 'Pcf8574/manifest.yaml'));
  // TODO: remove
  await env.addDevice(path.join(devicesRoot, 'PortExpanderEsp32/manifest.yaml'));

  // drivers
  await env.addDriver(path.join(driversRoot, 'Binary/BinaryInput.yaml'));
  await env.addDriver(path.join(driversRoot, 'Binary/BinaryOutput.yaml'));
  await env.addDriver(path.join(driversRoot, 'Binary/ImpulseInput.yaml'));
  await env.addDriver(path.join(driversRoot, 'Binary/ImpulseOutput.yaml'));
  await env.addDriver(path.join(driversRoot, 'Binary/BinaryClick.yaml'));
  await env.addDriver(path.join(driversRoot, 'DigitalPin/DigitalPinInput.yaml'));
  await env.addDriver(path.join(driversRoot, 'DigitalPin/DigitalPinOutput.yaml'));
  await env.addDriver(path.join(driversRoot, 'I2c/I2cData.yaml'));
  await env.addDriver(path.join(driversRoot, 'I2c/I2cMaster.yaml'));
  await env.addDriver(path.join(driversRoot, 'I2c/I2cToSlave.yaml'));
  await env.addDriver(path.join(driversRoot, 'I2c/I2cSlave.yaml'));
  await env.addDriver(path.join(driversRoot, 'I2c/I2cToMaster.yaml'));
  await env.addDriver(path.join(driversRoot, 'I2c/I2cDuplex.yaml'));
  await env.addDriver(path.join(driversRoot, 'Serial/SerialDuplex.yaml'));

  // TODO: remove
  await env.addDriver(path.join(driversRoot, 'DigitalPin/Digital_local.yaml'));
  // TODO: remove
  await env.addDriver(path.join(driversRoot, 'DigitalPin/Digital_pcf8574.yaml'));
  // TODO: remove
  await env.addDriver(path.join(driversRoot, 'DigitalPin/Digital_portExpander.yaml'));
  // TODO: remove
  await env.addDriver(path.join(driversRoot, 'Pcf8574/manifest.yaml'));
  // TODO: remove
  await env.addDriver(path.join(driversRoot, 'PortExpander/manifest.yaml'));

  // network connections drivers
  //await env.addDriver(path.join(networkConnectionDriversRoot, 'I2c.connection'));

  // services
  await env.addService(path.join(servicesRoot, 'Mqtt/manifest.yaml'));
  await env.addService(path.join(servicesRoot, 'Logger/manifest.yaml'));
}
