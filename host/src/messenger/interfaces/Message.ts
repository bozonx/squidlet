export default interface Message {
  // name of category of message
  category: string;
  // unique topic of message in category
  topic: string;
  // hostId of host which emits a message
  from: string;
  // destination hostId
  to: string;
  payload?: any;
}
