import { makeUniqId } from 'squidlet-lib/src/uniqId';
import Network from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/plugins/networking/services/Network/Network.js';
import { NETWORK_CHANNELS } from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/plugins/networking/constants.js';
import { encodeEventEmitPayload, encodeEventOffPayload, encodeEventRegisterPayload } from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/plugins/networking/services/Network/networkHelpers.js';
import { BRIDGE_MANAGER_EVENTS } from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/plugins/networking/services/Network/BridgesManager.js';
export class UriEvents {
    network;
    localSideHandlers = {};
    constructor(network) {
        this.network = network;
        this.network.bridgesManager.on(BRIDGE_MANAGER_EVENTS.incomeMessage, this.handleIncomeMessage);
    }
    // TODO: мы поднимает просто событие,
    //  а уже потом смотрится кто на нас подписан и туда рассылается
    emit(uri, eventName, ...params) {
        const hostId = this.network.hostResolver.resolveHostIdByName(hostName);
        const messageId = makeUniqId();
        const payload = encodeEventEmitPayload(eventName, ...params);
        this.network.$sendMessage(NETWORK_CHANNELS.eventOffRequest, messageId, hostId, payload, uri)
            .catch((e) => this.network.context.log.error(String(e)));
    }
    async on(hostName, uri, eventName, cb) {
        const hostId = this.network.hostResolver.resolveHostIdByName(hostName);
        const messageId = makeUniqId();
        const handlerId = makeUniqId();
        const payload = encodeEventRegisterPayload(eventName, handlerId);
        await this.network.$sendMessage(NETWORK_CHANNELS.eventRegisterRequest, messageId, hostId, payload, uri);
        //  TODO: нужно слушать ответ что все ок
        this.localSideHandlers[handlerId] = cb;
        return handlerId;
    }
    async off(hostName, 
    // TODO: лучше убрать uri
    uri, handlerId) {
        const hostId = this.network.hostResolver.resolveHostIdByName(hostName);
        const messageId = makeUniqId();
        const payload = encodeEventOffPayload(handlerId);
        await this.network.$sendMessage(NETWORK_CHANNELS.eventOffRequest, messageId, hostId, payload, uri);
        //  TODO: нужно слушать ответ что все ок
        delete this.localSideHandlers[handlerId];
    }
    handleIncomeMessage = (connectionId, channel, messagePayload) => {
    };
}
