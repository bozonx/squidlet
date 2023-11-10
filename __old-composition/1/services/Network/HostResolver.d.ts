export declare class HostResolver {
    constructor();
    destroy(): Promise<void>;
    resolveHostIdByName(hostName: string): string;
    resolveConnection(hostId: string): string;
}
