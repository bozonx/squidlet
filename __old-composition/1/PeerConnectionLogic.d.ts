export default class PeerConnectionLogic {
    private events;
    private connectionPromised;
    private readonly pingCb;
    private readonly isConnectionErrorCb;
    private pingTimeout?;
    private readonly pingCount;
    private readonly pingIntervalMs;
    private pingDone;
    get promise(): Promise<void>;
    constructor(pingCb: () => Promise<void>, isConnectionErrorCb: (e: Error) => boolean, pingIntervalMs: number, pingCount: number);
    send(requestCb: () => Promise<any>): Promise<any>;
    isConnected(): boolean;
    onConnected(cb: () => void): number;
    onDisconnected(cb: () => void): number;
    removeListener(handlerIndex: number): void;
    private startPing;
    private handlePing;
    private stopPing;
}
