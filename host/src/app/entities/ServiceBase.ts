import EntityBase from './EntityBase';
import {EntityProps} from '../interfaces/EntityDefinition';


export interface ServiceBaseProps extends EntityProps {
}


export default class ServiceBase<Props extends ServiceBaseProps> extends EntityBase<Props> {
}
