import { BRIDGE_EVENT, BridgeConnectionState, BridgeDriver } from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/plugins/networking/interfaces/BridgeDriver.js';
import { WsServerDriverProps, WsServerInstance } from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/drivers/WsServerDriver/WsServerDriver.js';
import DriverFactoryBase from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/base/DriverFactoryBase.js';
import DriverInstanceBase from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/base/DriverInstanceBase.js';
interface WsServerBridgeProps extends WsServerDriverProps {
}
export declare class WsServerBridgeInstance extends DriverInstanceBase<WsServerBridgeProps> implements BridgeDriver {
    private events;
    private connectionState;
    private currentConnectionId?;
    driver: WsServerInstance;
    init(): Promise<void>;
    $doDestroy(): Promise<void>;
    on(eventName: BRIDGE_EVENT, cb: (...params: any[]) => void): number;
    off(handlerIndex: number): void;
    getConnectionState(): BridgeConnectionState;
    sendMessage(channel: number, body: Uint8Array): Promise<void>;
    private handleNewConnection;
    private handleConnectionClosed;
    private handleNewMessage;
}
export declare class WsServerBridgeDriver extends DriverFactoryBase<WsServerBridgeProps> {
    protected SubDriverClass: typeof WsServerBridgeInstance;
    protected makeInstanceId: (props: WsServerBridgeProps) => string;
}
export {};
