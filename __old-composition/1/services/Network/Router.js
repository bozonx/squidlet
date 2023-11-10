import IndexedEvents from '../squidlet-lib/src/IndexedEvents';
import { makeUniqId } from '../squidlet-lib/src/uniqId';
import { omitObj } from '../squidlet-lib/src/objects';
import { lastItem } from '../squidlet-lib/src/arrays';
import Connection from '../../../../../squidlet/__old/system/interfaces/Connection';
import { decodeNetworkMessage, encodeNetworkMessage } from '../../../../../../../../../../../mnt/disk2/workspace/squidlet/__old-composition/services/Network/helpers.js';
import RouteResolver from '../../../../../../../../../../../mnt/disk2/workspace/squidlet/__old-composition/services/Network/RouteResolver.js';
import NetworkMessage from '../../../../../../../../../../../mnt/disk2/workspace/squidlet/__old-composition/services/Network/interfaces/NetworkMessage.js';
import { NETWORK_PORT } from '../../../../../../../../../../../mnt/disk2/workspace/squidlet/__old-composition/services/Network/NetworkLogic.js';
// TODO: add get name
// TODO: ping, pong
/**
 * It sends and receives messages into network.
 * It resends messages further to the next subnet.
 */
export default class Router {
    peerConnections;
    myId;
    defaultTtl;
    logWarn;
    logError;
    routeResolver;
    incomeMessagesEvents = new IndexedEvents();
    constructor(peerConnections, myId, defaultTtl, logWarn, logError) {
        this.peerConnections = peerConnections;
        this.myId = myId;
        this.defaultTtl = defaultTtl;
        this.logWarn = logWarn;
        this.logError = logError;
        this.routeResolver = new RouteResolver(myId);
    }
    init() {
        this.routeResolver.init();
        this.peerConnections.onIncomeMessage(this.handleIncomeMessages);
        this.peerConnections.onPeerConnect((peerId) => {
            // TODO: сделать запрос имени хоста и зарегистрировать его
        });
        this.peerConnections.onPeerDisconnect((peerId) => {
            this.routeResolver.deactivatePeer(peerId);
        });
    }
    destroy() {
        this.routeResolver.destroy();
        this.incomeMessagesEvents.destroy();
    }
    newMessageId() {
        // TODO: set 8 bytes length
        return makeUniqId();
    }
    onIncomeMessage(cb) {
        return this.incomeMessagesEvents.addListener(cb);
    }
    removeListener(handlerIndex) {
        this.incomeMessagesEvents.removeListener(handlerIndex);
    }
    /**
     * Send new message
     * If TTL doesn't set the default value will be used.
     * It just sends and doesn't wait for any response.
     * If it is the new request, make messageId by calling `router.newMessageId()`
     */
    async send(toHostId, uri, payload, messageId, TTL) {
        const encodedMessage = encodeNetworkMessage({
            TTL: TTL || this.defaultTtl,
            messageId,
            uri,
            to: toHostId,
            completeRoute: [this.myId],
            payload,
        });
        await this.sendToPeer(toHostId, encodedMessage);
    }
    handleIncomeMessages(peerId, port, payload) {
        // listen only our port
        if (port !== NETWORK_PORT)
            return;
        const incomeMessage = decodeNetworkMessage(payload);
        this.routeResolver.saveRoute(incomeMessage.completeRoute);
        this.routeResolver.activatePeer(peerId, lastItem(incomeMessage.completeRoute));
        if (incomeMessage.to !== this.myId) {
            // if receiver isn't current host then send message further
            this.sendFurther(incomeMessage)
                .catch(this.logError);
            return;
        }
        // if it is ours - rise an event
        this.incomeMessagesEvents.emit(incomeMessage);
    }
    /**
     * Send mediate message further
     * @param incomeMessage
     */
    async sendFurther(incomeMessage) {
        if (incomeMessage.TTL <= 0) {
            return this.logWarn(`TTL of network message has been exceeded: `
                + `${JSON.stringify(omitObj(incomeMessage, 'payload'))}`
                + `. Payload length is ${incomeMessage.payload.length}`);
        }
        const encodedMessage = encodeNetworkMessage({
            ...incomeMessage,
            // add current host as a bearer
            completeRoute: [...incomeMessage.completeRoute, this.myId],
            // decrement TTL on each host
            TTL: incomeMessage.TTL - 1,
        });
        await this.sendToPeer(incomeMessage.to, encodedMessage);
    }
    async sendToPeer(to, payload) {
        const closestHostId = this.routeResolver.resolveClosestHostId(to);
        // TODO: поидее нужно сделать ping
        if (!closestHostId)
            throw new Error(`No route to host`);
        const peerId = this.routeResolver.resolvePeerId(closestHostId);
        if (!peerId)
            throw new Error(`Can't resolve peer of host ${closestHostId}`);
        await this.peerConnections.send(peerId, NETWORK_PORT, payload);
    }
}
