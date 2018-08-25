import * as path from 'path';
import Manager from './Manager';

const devicesRoot = path.resolve(__dirname, '../devices');
const driversRoot = path.resolve(__dirname, '../drivers');
const servicesRoot = path.resolve(__dirname, '../services');
const networkConnectionDriversRoot = path.resolve(__dirname, '../network/connections');


export default function systemPlugin (manager: Manager) {
  // devices
  manager.addDevice(path.join(devicesRoot, 'BinarySensor'));
  manager.addDevice(path.join(devicesRoot, 'Switch'));

  // drivers
  manager.addDriver(path.join(driversRoot, 'GPIO/GpioInput.driver'));
  manager.addDriver(path.join(driversRoot, 'GPIO/GpioInput_raspberry.driver'));
  manager.addDriver(path.join(driversRoot, 'GPIO/GpioOutput.driver'));
  manager.addDriver(path.join(driversRoot, 'I2c/I2cData.driver'));
  manager.addDriver(path.join(driversRoot, 'I2c/I2cMaster.driver'));
  manager.addDriver(path.join(driversRoot, 'I2c/I2cSlave.driver'));
  // network connections drivers
  manager.addDriver(path.join(networkConnectionDriversRoot, 'I2c.connection.driver'));

  // services
  manager.addService(path.join(servicesRoot, 'Mqtt'));
}
