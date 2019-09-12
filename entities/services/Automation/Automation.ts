import ServiceBase from 'system/base/ServiceBase';
import RuleItem from './interfaces/RuleItem';
import RuleDefinition from './interfaces/RuleDefinition';


interface Props {
  rules: RuleDefinition[];
}

let nameIndex: number = 0;


export default class Automation extends ServiceBase<Props> {
  private readonly rules: RuleItem[] = [];


  protected appDidInit = async () => {
    this.prepareRules();
  }


  private prepareRules() {
    for (let ruleDefinition of this.props.rules) {
      this.validateRule(ruleDefinition);

      const ruleItem: RuleItem = {
        name: ruleDefinition.name || this.generateQniqName(),
      };

      this.rules.push(ruleItem);
    }
  }


  private validateRule(ruleDefinition: RuleDefinition) {
    // TODO: validate rule definiton
  }

  private generateQniqName(): string {
    nameIndex++;

    return String(nameIndex);
  }

}
