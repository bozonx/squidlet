
export default class RouteResolver {
  // host ids like {peerId: hostId}
  private hostIds: {[index: string]: string} = {};


  init() {
  }

  destroy() {
  }


  resolveRoute(toHostId: string): string[] {
    // TODO: add
    return [];
  }

  resolveClosestHostId(route: string[]): string {
    // TODO: add
    return route[0];
  }

  resolvePeerId(closestHostId: string): string | undefined {
    for (let peerId of Object.keys(this.hostIds)) {
      if (this.hostIds[peerId] === closestHostId) return peerId;
    }

    return;
  }

  saveRoute(route: string[]) {
    // TODO: add
  }

  activatePeer(peerId: string, hostId: string) {
    this.hostIds[peerId] = hostId;
  }

  deactivatePeer(peerId: string) {
    delete this.hostIds[peerId];
  }

}
