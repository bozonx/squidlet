import Connection from '../../../../../squidlet/__old/system/interfaces/Connection';
import NetworkMessage from '../../../../../../../../../../../mnt/disk2/workspace/squidlet/__old-composition/services/Network/interfaces/NetworkMessage.js';
type IncomeMessageHandler = (incomeMessage: NetworkMessage) => void;
/**
 * It sends and receives messages into network.
 * It resends messages further to the next subnet.
 */
export default class Router {
    private readonly peerConnections;
    private readonly myId;
    private readonly defaultTtl;
    private readonly logWarn;
    private readonly logError;
    private routeResolver;
    private incomeMessagesEvents;
    constructor(peerConnections: Connection, myId: string, defaultTtl: number, logWarn: (msg: string) => void, logError: (msg: string) => void);
    init(): void;
    destroy(): void;
    newMessageId(): string;
    onIncomeMessage(cb: IncomeMessageHandler): number;
    removeListener(handlerIndex: number): void;
    /**
     * Send new message
     * If TTL doesn't set the default value will be used.
     * It just sends and doesn't wait for any response.
     * If it is the new request, make messageId by calling `router.newMessageId()`
     */
    send(toHostId: string, uri: string, payload: Uint8Array, messageId: string, TTL?: number): Promise<void>;
    private handleIncomeMessages;
    /**
     * Send mediate message further
     * @param incomeMessage
     */
    private sendFurther;
    private sendToPeer;
}
export {};
