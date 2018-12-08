import * as path from 'path';
import * as gulp from 'gulp';
import * as yargs from 'yargs';
import {readConfig, resolveConfigPath} from './helpers';
import Main from '../configWorks/Main';
import PreMasterConfig from '../configWorks/interfaces/PreMasterConfig';
import {HostFilesSet} from '../host/src/app/interfaces/HostFilesSet';
//import * as ts from 'gulp-typescript';
const ts = require('gulp-typescript');


// build system with platform
// * slave_x86
// * slave_rpi
// * slave_esp8266
// * slave_esp32
gulp.task('dist', function () {
  // TODO: сделать slave билд под каждую платформу
  // TODO: интегрировать config set manager для слейва


  return gulp.src([
    //'buildSet/node_modules/systemjs/dist/system.js',
    'buildSet/systemLoader.ts',
    'buildSet/builder/src/**/*.ts'
  ])
    //.pipe(concat('buildSet/node_modules/requirejs/bin/r.js'))
    .pipe(ts({
      allowJs: true,
      noImplicitAny: true,
      module: 'system',
      outFile: 'output.js'
    }))
    .pipe(gulp.dest('buildSet/builder/build'));
});


// slave
// * receives hostId, master config
// * get its own network config from master config
// * generate minimum network config
// * make build of platform specified in config and build network config into
gulp.task('slave', function () {
  // TODO: самая минимальная прошивка - сама система будет загружаться с мастера
});


// solid - build all in one file (system, host config, platform devs and config, entities files)
// * it receives name of host
// * it generates host configs set and put it to build
gulp.task('solid', async function () {
  if (!yargs.argv.name) {
    throw new Error(`You have to specify a host's "--name" param`);
  }
  else if (!yargs.argv.config) {
    throw new Error(`You have to specify a master "--config" param`);
  }

  const hostId: string = yargs.argv.name;
  const resolvedPath: string = resolveConfigPath(yargs.argv.config);
  const masterConfig: PreMasterConfig = await readConfig<PreMasterConfig>(resolvedPath);
  const main: Main = new Main(masterConfig, resolvedPath);

  console.info(`===> Collecting configs and entities files of host`);
  await main.collect();

  console.info(`===> generate master config object`);
  const hostConfigSet: HostFilesSet = {
    ...main.hostsFilesSet.getDefinitionsSet(hostId),
    config: main.masterConfig.getFinalHostConfig(hostId),
    entitiesSet: main.hostsFilesSet.generateDstEntitiesSet(main, hostId),
  };

  console.log(111111111, hostConfigSet);

  // TODO: write tmp file with hostConfigSet as global to build/solid
  // TODO: write tmp file with entities as global
  // TODO: write tmp file with devs as global
});



// // generates hosts files exclude master
// gulp.task('generate-hosts-files', async function () {
//   return buildHostsConfigs(yargs.argv.config);
// });


// const cmd = `ts-node ${path.resolve(__dirname, '../index.ts')} --config ${yargs.argv.config}`;
//
// exec(cmd, function(error, stdout, stderr) {
//   console.info(stdout);
//
//   if (stderr) console.error(stderr);
//
//   if (error) return cb(error); // return error
//   cb(); // finished task
// });




//  const tsProject = ts.createProject('tsconfig.json');
// return tsProject.src()  // TODO: не билдить мастер
//   .pipe(tsProject())
//   .js
//   .pipe(concat('all.js'))
//   //.pipe(uglify())
//   .pipe(gulp.dest('build'));

// return gulp.src('./build/main.js')
//   .pipe(concat('all.js'))
//   //.pipe(uglify())
//   .pipe(gulp.dest('build'));
