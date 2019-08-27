import IoSet from './IoSet';
import System from '../index';
import {ShutdownReason} from './ShutdownReason';


export type ShutdownHandler = (reason: ShutdownReason) => void;

export type SystemClassType = new (
  ioSet: IoSet,
  handleShutdownRequest: ShutdownHandler,
  systemConfigExtend?: {[index: string]: any}
) => System;
