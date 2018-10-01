import * as path from 'path';
import PluginEnv from './PluginEnv';

const hostSrcRoot = '../host/src';
const devicesRoot = path.resolve(__dirname, hostSrcRoot, 'devices');
const driversRoot = path.resolve(__dirname, hostSrcRoot, 'drivers');
const servicesRoot = path.resolve(__dirname, hostSrcRoot, 'services');
const networkConnectionDriversRoot = path.resolve(__dirname, hostSrcRoot, 'network/connections');


export default async function systemPlugin (env: PluginEnv) {
  // devices
  await env.addDevice(path.join(devicesRoot, 'BinarySensor'));
  await env.addDevice(path.join(devicesRoot, 'Switch'));

  // drivers
  await env.addDriver(path.join(driversRoot, 'Binary/BinaryInput.driver.yaml'));
  await env.addDriver(path.join(driversRoot, 'Binary/BinaryOutput.driver'));
  await env.addDriver(path.join(driversRoot, 'Binary/ImpulseInput.driver'));
  await env.addDriver(path.join(driversRoot, 'Binary/ImpulseOutput.driver'));
  await env.addDriver(path.join(driversRoot, 'Digital/Digital_local.driver'));
  await env.addDriver(path.join(driversRoot, 'Digital/Digital_pcf8574.driver'));
  await env.addDriver(path.join(driversRoot, 'Digital/DigitalInput.driver'));
  await env.addDriver(path.join(driversRoot, 'Digital/DigitalOutput.driver'));
  await env.addDriver(path.join(driversRoot, 'I2c/I2cData.driver'));
  await env.addDriver(path.join(driversRoot, 'I2c/I2cMaster.driver'));
  await env.addDriver(path.join(driversRoot, 'I2c/I2cNode.driver'));
  await env.addDriver(path.join(driversRoot, 'I2c/I2cSlave.driver'));
  // network connections drivers
  //await env.addDriver(path.join(networkConnectionDriversRoot, 'I2c.connection.driver'));

  // services
  //await env.addService(path.join(servicesRoot, 'Mqtt'));
}
