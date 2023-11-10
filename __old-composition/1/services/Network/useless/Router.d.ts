import RemoteCallMessage from '../../../../../../squidlet/__old/system/interfaces/RemoteCallMessage';
import Context from '../../../../../../squidlet/__old/system/Context';
import NetworkMessage, { MessageType } from './interfaces/NetworkMessage';
import { NetworkProps } from './Network';
type MessageHandler = (message: NetworkMessage) => void;
export default class Router {
    private readonly context;
    private readonly props;
    private incomeMessagesEvents;
    private connections;
    constructor(context: Context, props: NetworkProps);
    init(): Promise<void>;
    destroy(): void;
    send(hostId: string, messageType: MessageType.remoteCall, payload: RemoteCallMessage | any): Promise<void>;
    /**
     * Listen only message which destination is current host or host hasn't been specified.
     */
    onIncomeDestMessage(cb: MessageHandler): number;
    removeListener(handlerIndex: number): void;
    private handleIncomeData;
    private resolveConnection;
}
export {};
