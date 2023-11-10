export default interface NetworkMessage {
    TTL: number;
    messageId: string;
    uri: string;
    to: string;
    completeRoute: string[];
    payload: Uint8Array;
}
