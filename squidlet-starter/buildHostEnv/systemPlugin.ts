import * as path from 'path';
import PluginEnv from './entities/PluginEnv';

const hostSrcRoot = '../../host/src';
const devicesRoot = path.resolve(__dirname, hostSrcRoot, 'devices');
const driversRoot = path.resolve(__dirname, hostSrcRoot, 'drivers');
const servicesRoot = path.resolve(__dirname, hostSrcRoot, 'services');
const networkConnectionDriversRoot = path.resolve(__dirname, hostSrcRoot, 'network/connections');


export default async function systemPlugin (env: PluginEnv) {
  // devices
  await env.addDevice(path.join(devicesRoot, 'ClickSensor/manifest.yaml'));
  await env.addDevice(path.join(devicesRoot, 'ImpulseSensor/manifest.yaml'));
  await env.addDevice(path.join(devicesRoot, 'BinarySensor/manifest.yaml'));
  await env.addDevice(path.join(devicesRoot, 'Toggle/manifest.yaml'));
  await env.addDevice(path.join(devicesRoot, 'Relay/manifest.yaml'));
  await env.addDevice(path.join(devicesRoot, 'Switch/manifest.yaml'));
  await env.addDevice(path.join(devicesRoot, 'SwitchSensor/manifest.yaml'));
  // TODO: remove
  await env.addDevice(path.join(devicesRoot, 'FakePeopleCount/manifest.yaml'));
  // TODO: remove
  await env.addDevice(path.join(devicesRoot, 'Pcf8574/manifest.yaml'));
  // TODO: remove
  await env.addDevice(path.join(devicesRoot, 'PortExpander/manifest.yaml'));

  // drivers
  await env.addDriver(path.join(driversRoot, 'Binary/BinaryInput.driver.yaml'));
  await env.addDriver(path.join(driversRoot, 'Binary/BinaryOutput.driver.yaml'));
  await env.addDriver(path.join(driversRoot, 'Binary/ImpulseInput.driver.yaml'));
  await env.addDriver(path.join(driversRoot, 'Binary/ImpulseOutput.driver.yaml'));
  await env.addDriver(path.join(driversRoot, 'DigitalPin/DigitalPinInput.driver.yaml'));
  await env.addDriver(path.join(driversRoot, 'DigitalPin/DigitalPinOutput.driver.yaml'));
  await env.addDriver(path.join(driversRoot, 'I2c/I2cData.driver.yaml'));
  await env.addDriver(path.join(driversRoot, 'I2c/I2cMaster.driver.yaml'));
  await env.addDriver(path.join(driversRoot, 'I2c/I2cNode.driver.yaml'));
  await env.addDriver(path.join(driversRoot, 'I2c/I2cSlave.driver.yaml'));

  // TODO: remove
  await env.addDriver(path.join(driversRoot, 'DigitalPin/Digital_local.driver.yaml'));
  // TODO: remove
  await env.addDriver(path.join(driversRoot, 'DigitalPin/Digital_pcf8574.driver.yaml'));
  // TODO: remove
  await env.addDriver(path.join(driversRoot, 'Pcf8574/manifest.yaml'));
  // TODO: remove
  await env.addDriver(path.join(driversRoot, 'PortExpander/manifest.yaml'));

  // network connections drivers
  //await env.addDriver(path.join(networkConnectionDriversRoot, 'I2c.connection.driver'));

  // services
  await env.addService(path.join(servicesRoot, 'Mqtt/manifest.yaml'));
  await env.addService(path.join(servicesRoot, 'Logger/manifest.yaml'));
}
