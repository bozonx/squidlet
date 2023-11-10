type BridgesManagerHandler = (connectionId: string, channel: number, payload: Uint8Array) => void;
export declare enum BRIDGE_MANAGER_EVENTS {
    incomeMessage = 0
}
export declare class BridgesManager {
    private events;
    init(): Promise<void>;
    destroy(): Promise<void>;
    send(connectionId: string, channel: number, payload: Uint8Array): Promise<void>;
    on(eventName: BRIDGE_MANAGER_EVENTS, cb: BridgesManagerHandler): number;
    off(handlerIndex: number): void;
}
export {};
