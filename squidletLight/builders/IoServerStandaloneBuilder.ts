import Platforms from '../../system/interfaces/Platforms';
import * as path from "path";
import {HOST_TMP_DIR} from '../../shared/constants';
import Os from '../../shared/Os';

export class IoServerStandaloneBuilder {
  private readonly workDir: string;
  private readonly platform: Platforms;
  private readonly machine: string;
  private readonly tmpDir: string;
  private readonly minimize: boolean;
  private readonly os: Os = new Os();


  constructor(
    workDir: string,
    platform: Platforms,
    machine: string,
    hostConfigPath: string,
    minimize: boolean = true
  ) {
    this.workDir = workDir;
    this.platform = platform;
    this.machine = machine;
    this.tmpDir = path.join(this.workDir, HOST_TMP_DIR);
    this.minimize = minimize;
  }


  async build() {

  }


  private makeIndexFile(): string {

  }

}
