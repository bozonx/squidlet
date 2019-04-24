import * as WebSocket from 'ws';
import {ClientRequest, IncomingMessage} from 'http';
import _omit = require('lodash/omit');

import RemoteIoBase from '../../system/ioSet/RemoteIoBase';
import IoSet from '../../system/interfaces/IoSet';
import System from '../../system/System';
import RemoteCallMessage from '../../system/interfaces/RemoteCallMessage';


export interface WsClientProps {
  host: string;
  port: number;
}


export default class IoSetWs extends RemoteIoBase implements IoSet {

}
