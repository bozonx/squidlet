export default class ActivePeers {
  // connections by peers - {peerId: connectionName}
  private activePeers: {[index: string]: string} = {};


  constructor() {
  }

  init() {
  }

  destroy() {
    delete this.activePeers;
  }


  resolveConnectionName(peerId: string): string | undefined {
    return this.activePeers[peerId];
  }

  activatePeer(peerId: string, connectionName: string) {
    if (this.activePeers[peerId] && this.activePeers[peerId] !== connectionName) {
      throw new Error(
        `Peer ${peerId} has different connection.` +
        ` Last is ${this.activePeers[peerId]}, new id ${connectionName}`
      );
    }

    this.activePeers[peerId] = connectionName;

    // TODO: rise an event
  }

  deactivatePeer(peerId: string) {
    delete this.activePeers[peerId];
  }

}
