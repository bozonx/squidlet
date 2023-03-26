import Destination from '../../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/network/network/interfaces/Destination';
import MyAddress from '../../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/network/interfaces/MyAddress';


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
