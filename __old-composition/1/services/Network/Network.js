import ServiceBase from '../../../../../squidlet/__old/system/base/ServiceBase';
import NetworkLogic, { UriHandler } from '../../../../../../../../../../../mnt/disk2/workspace/squidlet/__old-composition/services/Network/NetworkLogic.js';
export default class Network extends ServiceBase {
    logic;
    init = async () => {
        this.logic = new NetworkLogic(this.context.service.PeerConnections, this.context.config.id, this.context.config.config.requestTimeoutSec, this.context.config.config.defaultTtl, this.context.log.warn, this.context.log.error);
        this.logic.init();
    };
    destroy = async () => {
        this.logic.destroy();
    };
    async request(toHostId, uri, payload, TTL) {
        return this.logic.request(toHostId, uri, payload, TTL);
    }
    startListenUri(uri, handler) {
        this.logic.startListenUri(uri, handler);
    }
    stopListenUri(uri) {
        this.logic.stopListenUri(uri);
    }
}
