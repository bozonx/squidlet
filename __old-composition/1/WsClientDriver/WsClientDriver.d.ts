import DriverFactoryBase from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/base/DriverFactoryBase.js';
import DriverInstanceBase from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/base/DriverInstanceBase.js';
import WsClientIo, { WsClientEvent, WsClientProps } from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/io/WsClientIo.js';
export declare enum WS_CLIENT_DRIVER_EVENTS {
    incomeMessage = 0
}
interface WsClientDriverProps extends WsClientProps {
}
export declare class WsClientInstance extends DriverInstanceBase<WsClientDriverProps, WsClientDriver> {
    get connectionId(): string;
    private get wsClientIo();
    private events;
    private _connectionId;
    $incomeEvent(eventName: WsClientEvent, ...params: any[]): void;
    init(): Promise<void>;
    $doDestroy(): Promise<void>;
    on(eventName: WS_CLIENT_DRIVER_EVENTS, cb: (...params: any[]) => void): number;
    off(handlerIndex: number): void;
    sendMessage(connectionId: string, data: string | Uint8Array): Promise<void>;
    private waitForConnectionOpened;
}
export declare class WsClientDriver extends DriverFactoryBase<WsClientDriverProps> {
    protected SubDriverClass: typeof WsClientInstance;
    protected makeInstanceId: (props: WsClientDriverProps) => string;
    wsClientIo: WsClientIo;
    init(): Promise<void>;
    private passEventToInstance;
    private resolveInstanceIdByConnectionId;
}
export {};
