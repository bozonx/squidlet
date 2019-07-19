import IoSet from '../../system/interfaces/IoSet';
import System from '../../system';


export type SystemClassType = new (ioSet?: IoSet, systemConfigExtend?: {[index: string]: any}) => System;
