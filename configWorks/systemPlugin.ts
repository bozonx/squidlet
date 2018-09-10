import * as path from 'path';
import PluginEnv from './PluginEnv';

const devicesRoot = path.resolve(__dirname, '../devices');
const driversRoot = path.resolve(__dirname, '../drivers');
const servicesRoot = path.resolve(__dirname, '../services');
const networkConnectionDriversRoot = path.resolve(__dirname, '../network/connections');


export default async function systemPlugin (env: PluginEnv) {
  // devices
  await env.addDevice(path.join(devicesRoot, 'BinarySensor'));
  await env.addDevice(path.join(devicesRoot, 'Switch'));

  // drivers
  await env.addDriver(path.join(driversRoot, 'GPIO/GpioInput.driver'));
  await env.addDriver(path.join(driversRoot, 'GPIO/GpioInput_raspberry.driver'));
  await env.addDriver(path.join(driversRoot, 'GPIO/GpioOutput.driver'));
  await env.addDriver(path.join(driversRoot, 'I2c/I2cData.driver'));
  await env.addDriver(path.join(driversRoot, 'I2c/I2cMaster.driver'));
  await env.addDriver(path.join(driversRoot, 'I2c/I2cSlave.driver'));
  // network connections drivers
  await env.addDriver(path.join(networkConnectionDriversRoot, 'I2c.connection.driver'));

  // services
  await env.addService(path.join(servicesRoot, 'Mqtt'));
}
