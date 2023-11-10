import RemoteCallMessage from '../../../../../../squidlet/__old/system/interfaces/RemoteCallMessage';
import Context from '../../../../../../squidlet/__old/system/Context';
import NetworkDriver, { NetworkRequest, NetworkResponse, NetworkStatus } from '../../../../../../squidlet/__old/system/interfaces/NetworkDriver';
import IndexedEvents from '../squidlet-lib/src/IndexedEvents';
import { omitObj } from '../squidlet-lib/src/objects';
import NetworkMessage, { MessageType } from './interfaces/NetworkMessage';
import { deserializeMessage, serializeMessage } from './helpers';
import { NETWORK_PORT, NetworkProps } from './Network';
export default class Router {
    context;
    props;
    incomeMessagesEvents = new IndexedEvents();
    // driver instances by index of props.interfaces
    connections = [];
    constructor(context, props) {
        this.context = context;
        this.props = props;
    }
    async init() {
        if (!this.props.interfaces)
            return;
        for (let index in this.props.interfaces) {
            this.connections[index] = await this.context.getSubDriver(
            // TODO: сделать резолв имени драйвера
            this.props.interfaces[index].driver, omitObj(this.props, 'driver'));
            this.connections[index].onRequest(NETWORK_PORT, this.handleIncomeData);
        }
    }
    destroy() {
        this.incomeMessagesEvents.destroy();
        delete this.connections;
    }
    async send(hostId, messageType, payload) {
        const message = {
            to: hostId,
            from: this.context.id,
            messageType,
            payload
        };
        // TODO: handle error
        const data = serializeMessage(message);
        const connection = this.resolveConnection(hostId);
        const response = await connection.request(NETWORK_PORT, data);
        if (response.status === NetworkStatus.errorMessage) {
            // TODO: где будет обработка error на самом деле ?????
            if (response.error) {
                this.context.log.error(response.error);
            }
            else {
                this.context.log.error(`Network Router: empty error message from "${hostId}"`);
            }
        }
        // ignore response body
    }
    /**
     * Listen only message which destination is current host or host hasn't been specified.
     */
    onIncomeDestMessage(cb) {
        return this.incomeMessagesEvents.addListener(cb);
    }
    removeListener(handlerIndex) {
        this.incomeMessagesEvents.removeListener(handlerIndex);
    }
    handleIncomeData = async (request) => {
        // TODO: handle error
        const incomeMessage = deserializeMessage(request.body);
        if (!incomeMessage.to || incomeMessage.to === this.context.id) {
            // ours message
            this.incomeMessagesEvents.emit(incomeMessage);
        }
        else {
            // send further
            // TODO: add - вычислить ближайший хост для отправки
        }
        return {
            requestId: request.requestId,
            status: NetworkStatus.ok,
        };
    };
    resolveConnection(hostId) {
        // TODO: add
        // TODO: как зарезолвить если hostId может повторяться????
    }
}
