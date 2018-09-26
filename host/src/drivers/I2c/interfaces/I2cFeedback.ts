import MasterSlaveBusProps from '../../../app/interfaces/MasterSlaveBusProps';


export interface I2cFeedback extends MasterSlaveBusProps {
  // length of data which will be requested
  dataLength: number;
}
