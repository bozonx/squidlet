import Destination from '../../messenger/interfaces/Destination';
import MyAddress from '../../app/interfaces/MyAddress';


export default interface HostNetworkConfig {
  params: {
    routedMessageTTL: number,
  };
  connections: Array<MyAddress>;
  // addresses of the nearest neighbors hosts
  neighbors: {[index: string]: Destination};
  // TODO: наверное сделать просто массивом, а список сервисов - отдельно
  // routes for coordinators and links - { destHostId: route: [ 'currentHost', 'midHost', 'destHostId' ] }
  routes: {[index: string]: Array<string>};
}
