import DriverEnv from './DriverEnv';
import {EntityProps} from '../interfaces/EntityDefinition';


export default abstract class DriverFactoryBase<Instance> {
  protected instances: {[index: string]: Instance} = {};
  protected abstract instanceIdName: string | number;
  protected abstract DriverClass: new (props: EntityProps, env: DriverEnv) => Instance;
  protected readonly env: DriverEnv;
  protected readonly props: EntityProps;

  constructor(props: EntityProps, env: DriverEnv) {
    this.props = props;
    this.env = env;
  }

  getInstance(additionalProps: {[index: string]: any}): Instance {
    if (this.instances[this.instanceIdName]) return this.instances[this.instanceIdName];

    const props = {
      ...this.props,
      ...additionalProps,
    };

    this.instances[this.instanceIdName] = new this.DriverClass(props, this.env);

    return this.instances[this.instanceIdName];
  }

}
