

export interface SystemCfg {
  defaultVersionsCount: number
  // like {fullRelPathToDir: 10}
  versionsCount: Record<string, number>
}

export const systemCfgDefaults: SystemCfg = {
  defaultVersionsCount: 5,
  versionsCount: {},
}
