import { BRIDGE_EVENT, BridgeConnectionState, BridgeDriver } from '../../interfaces/BridgeDriver';
import { WsServerDriverProps, WsServerInstance } from '../../../../drivers/WsServerDriver/WsServerDriver';
import DriverFactoryBase from '../../../../base/DriverFactoryBase';
import DriverInstanceBase from '../../../../base/DriverInstanceBase';
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
