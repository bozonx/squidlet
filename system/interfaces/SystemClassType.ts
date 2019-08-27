import IoSet from './IoSet';
import System from '../index';


export type SystemClassType = new (ioSet?: IoSet, systemConfigExtend?: {[index: string]: any}) => System;
