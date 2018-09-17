import DriverEnv from './DriverEnv';
import {EntityProps} from '../interfaces/EntityDefinition';


export default abstract class DriverFactoryBase<Instance, Props extends EntityProps> {
  protected instances: {[index: string]: Instance} = {};
  protected abstract instanceIdName: string;
  protected abstract DriverClass: new (props: Props, env: DriverEnv) => Instance;
  protected readonly env: DriverEnv;
  protected readonly props: Props;

  constructor(props: Props, env: DriverEnv) {
    this.props = props;
    this.env = env;
  }

  getInstance(additionalProps: Props): Instance {
    if (this.instances[this.instanceIdName]) return this.instances[this.instanceIdName];

    // TODO: ??? use defaults deep ???

    const props = {
      ...this.props as object,
      ...additionalProps as object,
    };

    this.instances[this.instanceIdName] = new this.DriverClass(props, this.env);

    return this.instances[this.instanceIdName];
  }

}
