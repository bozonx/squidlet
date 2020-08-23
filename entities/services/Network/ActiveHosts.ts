export interface HostItem {
  hostId: string;
  connectionId: string;
  connectionName: string;
}


/**
 * Closest hosts cache
 */
export default class ActiveHosts {
  resolveByHostId(hostId: string): HostItem | undefined {

  }

}
