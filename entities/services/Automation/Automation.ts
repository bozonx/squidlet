import ServiceBase from 'system/base/ServiceBase';
import RuleItem from './interfaces/RuleItem';
import RuleDefinition from './interfaces/RuleDefinition';


interface Props {
  rules: RuleDefinition[];
}


export default class Automation extends ServiceBase<Props> {
  private readonly rules: RuleItem[] = [];


  protected willInit = async () => {

  }

}
