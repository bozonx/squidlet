// type of feedback - polling or interruption
export type FeedbackType = 'poll' | 'int';

export default interface MasterSlaveBusProps {
  feedback: FeedbackType;
  polingInterval?: number;
}
