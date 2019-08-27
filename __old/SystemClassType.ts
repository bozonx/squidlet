import IoSet from '../system/interfaces/IoSet';
import System from '../system';
import {ShutdownReason} from '../system/interfaces/ShutdownReason';


export type SystemClassType = new (
  ioSet: IoSet,
  handleShutdownRequest: ShutdownHandler,
  systemConfigExtend?: {[index: string]: any}
) => System;
