import Connection from './Connection';
import MyAddress from '../../app/interfaces/MyAddress';


export default interface ConnectionDriver {
  getInstance: (connectionParams: MyAddress) => Connection;
}
