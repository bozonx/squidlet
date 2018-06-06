import Connection from './Connection';
import ConnectionParams from "./ConnectionParams";


export default interface ConnectionDriver {
  getInstance: (connectionParams: ConnectionParams) => Connection;
}
