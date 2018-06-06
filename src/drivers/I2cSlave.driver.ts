import * as EventEmitter from 'events';

import DevI2c from '../dev/I2c';
import { stringToHex } from '../helpers/helpers';
import Drivers from "../app/Drivers";

// TODO: сделать поддержку poling
// TODO: сделать поддержку int


export default class I2c {
  constructor(drivers: Drivers, driverParams: {[index: string]: any}) {

  }

}
