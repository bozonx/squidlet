import Destination from './Destination';
import MyAddress from '../../interfaces/MyAddress';


export default interface HostNetworkConfig {
  params: {
    routedMessageTTL: number,
    // timeout of waiting of request has finished
    requestTimeout: number,
  };
  connections: Array<MyAddress>;
  // addresses of the nearest neighbors hosts by hostId
  neighbors: {[index: string]: Destination};
  // TODO: наверное сделать просто массивом, а список сервисов - отдельно
  // routes for coordinators and links - { destHostId: route: [ 'currentHost', 'midHost', 'destHostId' ] }
  routes: {[index: string]: Array<string>};
}
