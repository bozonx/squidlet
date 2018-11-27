// type of feedback - polling or interruption
export type FeedbackType = 'poll' | 'int' | 'none';


//export const DEFAULT_INT = 'default';

export default interface MasterSlaveBusProps {
  feedback: FeedbackType;
  pollInterval: number;
  // name of interruption. It not specified, "default" will be used
  //intName?: string;
}
