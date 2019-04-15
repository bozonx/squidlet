import PublishParams from './PublishParams';


export default interface DeviceData {
  id: string;
  // action for income and status or config for outcome data.
  subTopic: string;
  data: any;
  params?: PublishParams;
}
