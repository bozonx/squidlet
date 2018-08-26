import * as path from 'path';
import Manager from './Manager';

const devicesRoot = path.resolve(__dirname, '../devices');
const driversRoot = path.resolve(__dirname, '../drivers');
const servicesRoot = path.resolve(__dirname, '../services');
const networkConnectionDriversRoot = path.resolve(__dirname, '../network/connections');


export default async function systemPlugin (manager: Manager) {
  // devices
  await manager.addDevice(path.join(devicesRoot, 'BinarySensor'));
  await manager.addDevice(path.join(devicesRoot, 'Switch'));

  // drivers
  await manager.addDriver(path.join(driversRoot, 'GPIO/GpioInput.driver'));
  await manager.addDriver(path.join(driversRoot, 'GPIO/GpioInput_raspberry.driver'));
  await manager.addDriver(path.join(driversRoot, 'GPIO/GpioOutput.driver'));
  await manager.addDriver(path.join(driversRoot, 'I2c/I2cData.driver'));
  await manager.addDriver(path.join(driversRoot, 'I2c/I2cMaster.driver'));
  await manager.addDriver(path.join(driversRoot, 'I2c/I2cSlave.driver'));
  // network connections drivers
  await manager.addDriver(path.join(networkConnectionDriversRoot, 'I2c.connection.driver'));

  // services
  await manager.addService(path.join(servicesRoot, 'Mqtt'));
}
