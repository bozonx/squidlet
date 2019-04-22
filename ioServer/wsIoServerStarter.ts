import WsIoServer, {WsServerProps} from './WsIoServer';
import {ObjectToCall} from '../system/helpers/RemoteCall';


async function start() {
  // TODO: get from yargs
  const serverProps: WsServerProps = {
    host: 'localhost',
    port: 8999,
  };

  // TODO: collect ioset
  const ioSet: {[index: string]: ObjectToCall} = {};

  const server = new WsIoServer(serverProps, ioSet);
}

start()
  .catch((err: Error) => console.log(err));
