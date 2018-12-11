// require('ts-node/register');
// require('./tasks.ts');

const gulp = require('gulp');
const ts = require('gulp-typescript');
const fs = require('fs');
const { fork } = require('child_process');
const path = require('path');
const yaml = require('js-yaml');
const _ = require('lodash');

const envConfig = yaml.load(fs.readFileSync('env-config.yaml'));

const mainFile = path.resolve(__dirname, './starterMc/index.ts');
const buildDirName = 'build/starter';
const buildDir = path.resolve(__dirname, buildDirName);
const compiledTsDir = path.join(buildDir, 'compiledTs');
const espReadyBundleFileName = 'bundle.js';

const distDir = './dist';
const appFileName = 'index.js';
const appFilePath = path.join(distDir, appFileName);

//const srcDir = './src';
// const appConfigTsFileName = 'app-config.ts';
// const appConfigFileName = 'app-config.yaml';
// const userAppConfigFileName = 'app-config.user.yaml';

const tsProject = ts.createProject('tsconfig-builder.json', {
  //rootDir: [''],
  //outDir: compiledTsDir,
  //outDir: 'cccc',
  //outFile: 'index.js',
});


gulp.task('build', ['prepare-for-espruino']);

gulp.task('prepare-for-espruino', ['compile-ts', 'content-to-dist'], (cb) => {
  if (!fs.existsSync(appFilePath)) {
    cb('main app file does not exit ' + appFilePath);
    return;
  }

  let appContent = fs.readFileSync(appFilePath).toString();
  appContent = appContent.replace('Object.defineProperty(exports, "__esModule", { value: true });', '');
  fs.writeFileSync(appFilePath, appContent);

  const buildproc = fork(
    require.resolve('espruino/bin/espruino-cli'),
    ['--board', envConfig.board, appFileName, '-o', espReadyBundleFileName],
    { cwd: distDir });
  buildproc.on('close', (code) => {
    cb();
  });
});

//, ['gen-config-ts']
gulp.task('compile-ts', function () {

  // const tsResult = tsProject.src().pipe(tsProject());
  // return tsResult.js.pipe(gulp.dest(compiledTsDir));

  return gulp.src([
    mainFile,
  ])
    .pipe(tsProject())

  // return tsProject.src().pipe(tsProject())
  //   .js.pipe(gulp.dest(compiledTsDir));
});

gulp.task('content-to-dist', () => {
  return gulp
    //, { base: 'src' }
    .src(path.join(compiledTsDir, '/**/*.js'))
    .pipe(gulp.dest(distDir));
});

// gulp.task('gen-config-ts', (cb) => {
//   if (!fs.existsSync(userAppConfigFileName)) {
//     const content = fs.readFileSync(appConfigFileName)
//       .toString()
//       .split('\n')
//       .map(x => `# ${x}`)
//       .join('\n');
//
//     fs.writeFileSync(userAppConfigFileName, content, { encoding: 'utf-8' });
//   }
//
//   const appConfig = yaml.load(fs.readFileSync(appConfigFileName));
//   const userAppConfig = yaml.load(fs.readFileSync(userAppConfigFileName));
//   const mergedAppConfig = _.assign(appConfig, userAppConfig);
//   const jsonString = JSON.stringify(mergedAppConfig);
//   const resultConfigTsContent = `export default ${jsonString};`;
//   fs.writeFileSync(path.join(srcDir, appConfigTsFileName), resultConfigTsContent);
//   cb();
// });
