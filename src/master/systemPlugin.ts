import * as path from 'path';
import Configurator from './Configurator';

const devicesRoot = path.resolve(__dirname, '../devices');
const driversRoot = path.resolve(__dirname, '../drivers');
const servicesRoot = path.resolve(__dirname, '../services');
const networkConnectionDriversRoot = path.resolve(__dirname, '../network/connections');


export default function systemPlugin (configurator: Configurator) {
  // devices
  configurator.addDevice(path.join(devicesRoot, 'BinarySensor'));
  configurator.addDevice(path.join(devicesRoot, 'Switch'));

  // drivers
  configurator.addDriver(path.join(driversRoot, 'GPIO/GpioInput.driver'));
  configurator.addDriver(path.join(driversRoot, 'GPIO/GpioInput_raspberry.driver'));
  configurator.addDriver(path.join(driversRoot, 'GPIO/GpioOutput.driver'));
  configurator.addDriver(path.join(driversRoot, 'I2c/I2cData.driver'));
  configurator.addDriver(path.join(driversRoot, 'I2c/I2cMaster.driver'));
  configurator.addDriver(path.join(driversRoot, 'I2c/I2cSlave.driver'));
  // network connections drivers
  configurator.addDriver(path.join(networkConnectionDriversRoot, 'I2c.connection.driver'));

  // services
  configurator.addService(path.join(servicesRoot, 'Mqtt'));
}
