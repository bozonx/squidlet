const _defaultsDeep = require('lodash/defaultsDeep');
const _cloneDeep = require('lodash/cloneDeep');

import DriverEnv from './DriverEnv';
import {EntityProps} from '../interfaces/EntityDefinition';


export default abstract class DriverFactoryBase<Instance, Props extends EntityProps> {
  protected instances: {[index: string]: Instance} = {};
  // name of instance id in props
  protected abstract instanceIdName: string;
  protected abstract DriverClass: new (props: Props, env: DriverEnv) => Instance;
  protected readonly env: DriverEnv;
  protected readonly props: Props;

  constructor(props: Props, env: DriverEnv) {
    this.props = props;
    this.env = env;
  }

  getInstance(additionalProps?: Props): Instance {
    if (this.instances[this.instanceIdName]) return this.instances[this.instanceIdName];

    const props = _defaultsDeep(_cloneDeep(additionalProps), this.props);

    this.instances[this.instanceIdName] = new this.DriverClass(props, this.env);

    return this.instances[this.instanceIdName];
  }

}
