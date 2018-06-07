export default interface Message {
  // name of category of message
  category: string;
  // unique topic of message in category
  topic: string;
  // destination hostId
  to: string;
  payload: any;


  // TODO: это реквест
  // hostId of host which emits a message
  from: string;
  // request or response unique id
  requestId?: string;
  isRequest?: boolean;
  isResponse?: boolean;

  errorMessage?: string,
  errorCode?: number,

}
