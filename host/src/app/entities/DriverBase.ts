import EntityBase from './EntityBase';
import {EntityProps} from '../interfaces/EntityDefinition';


export interface DriverBaseProps extends EntityProps {
}


export default class DriverBase<Props extends DriverBaseProps> extends EntityBase<Props> {
}
