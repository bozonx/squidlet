export default interface Message {
  // name of category of message
  category: string;
  // unique topic of message in category
  topic: string;
  // destination hostId
  to: string;
  payload: any;
}
