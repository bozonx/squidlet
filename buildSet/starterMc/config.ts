export type FileRoots = 'host';

export interface ConfigInterface {
  // main root on file system for al the modules
  systemRoot: string;
  systemDirs: {
    host: string;
  };
}

export default {
  systemRoot: 'system',
  systemDirs: {
    host: 'host',
  },
};
