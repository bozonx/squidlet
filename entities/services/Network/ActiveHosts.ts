export interface HostItem {
  hostId: string;
  peerId: string;
  connectionName: string;
}


/**
 * Closest hosts cache
 */
export default class ActiveHosts {
  private activeHosts: HostItem[];


  destroy() {
    // TODO: add
  }


  cacheHost(hostId: string, peerId: string, connectionName: string) {
    // TODO: add
  }

  // TODO: сделать регистрацию хостов
  // TODO: сделать удаление хостов когда он отсоединился

  resolveByHostId(hostId: string): HostItem | undefined {
    return this.activeHosts.find((item) => item.hostId === hostId);
  }

}
