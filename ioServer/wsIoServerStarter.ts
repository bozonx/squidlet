import * as yargs from 'yargs';

import WsIoServer, {WsServerProps} from './WsIoServer';
import {ObjectToCall} from '../system/helpers/RemoteCall';


async function start() {
  const argHost: string | undefined = yargs.argv.host as any;
  const argPort: number | undefined = yargs.argv.port && parseInt(yargs.argv.port as any);
  const serverProps: WsServerProps = {
    host: argHost || 'localhost',
    port: argPort || 8999,
  };

  // TODO: collect ioset

  const ioSet: {[index: string]: ObjectToCall} = {};

  const server = new WsIoServer(serverProps, ioSet);
}

start()
  .catch((err: Error) => console.log(err));
