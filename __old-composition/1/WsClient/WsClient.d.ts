import { OnMessageHandler } from '../../../../../squidlet/__old/system/interfaces/io/WsClientIo';
import DriverFactoryBase from '../../../../../squidlet/__old/system/base/DriverFactoryBase';
import DriverBase from '../../../../../squidlet/__old/system/base/DriverBase';
import { WsClientLogicProps } from '../../../../../../../../../../mnt/disk2/workspace/squidlet/__old-composition/drivers/WsClient/WsClientLogic.js';
/**
 * Simplified websocket driver.
 * If autoReconnect if set it holds connection for ever and reconnects if it lost.
 * By calling getInstance() you will get always a new one. There isn't any sessions.
 */
export declare class WsClient extends DriverBase<WsClientLogicProps> {
    get connectedPromise(): Promise<void>;
    private readonly closeEvents;
    private get wsClientIo();
    private client?;
    private get closedMsg();
    init: () => Promise<void>;
    destroy: () => Promise<void>;
    isConnected(): boolean;
    send(data: string | Uint8Array): Promise<void>;
    onMessage(cb: OnMessageHandler): number;
    onClose(cb: () => void): number;
    removeMessageListener(handlerId: number): void;
    removeCloseListener(handlerIndex: number): void;
    /**
     * It calls on unexpected closing of connection or on max reconnect tries is exceeded.
     */
    private onConnectionClosed;
}
export default class Factory extends DriverFactoryBase<WsClient, WsClientLogicProps> {
    protected SubDriverClass: typeof WsClient;
    protected instanceId: (props: WsClientLogicProps) => any;
}
