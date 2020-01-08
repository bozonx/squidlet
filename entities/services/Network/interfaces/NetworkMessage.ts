import RemoteCallMessage from '../../../../system/interfaces/RemoteCallMessage';


export enum MessageType {
  remoteCall,
}


export default interface NetworkMessage {
  // recipient host id
  // If doesn't set means closest host
  to?: string;
  // sender host id
  from: string;
  // type of message
  messageType: MessageType;
  // remoteCall's message
  payload: RemoteCallMessage | any;
}
