import Network from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/plugins/networking/services/Network/Network.js';
export declare class UriEvents {
    private network;
    private localSideHandlers;
    constructor(network: Network);
    emit(uri: string, eventName: string | number, ...params: any[]): void;
    on(hostName: string, uri: string, eventName: string | number, cb: (...params: any[]) => void): Promise<string>;
    off(hostName: string, uri: string, handlerId: string): Promise<void>;
    private handleIncomeMessage;
}
