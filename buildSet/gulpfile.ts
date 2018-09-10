import * as path from 'path';
import * as gulp from 'gulp';
import * as yargs from 'yargs';
import * as ts from 'gulp-typescript';
import * as concat from 'gulp-concat';
import * as uglify from 'gulp-uglify';

import {loadYamlFile} from '../configWorks/IO';
import MasterConfig from '../configWorks/MasterConfig';
import HostConfig from '../host/src/app/interfaces/HostConfig';
import generateHostSet from './generateHostSet';
import buildHostsConfigs from './buildHostsConfigs';
import generateMasterSet from './generateMasterSet';
import {PlatformIndex, readConfig, resolveConfigPath} from '../host/src/helpers';
import x86 from '../platforms/squidlet-x86/index';
import rpi from '../platforms/squidlet-rpi/index';



// build system with platform
// * slave_x86
// * slave_rpi
// * slave_esp8266
// * slave_esp32
gulp.task('dist', function () {
  // TODO: сделать slave билд под каждую платформу
  // TODO: интегрировать config set manager для слейва
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
// * it receives name of host(default is master), host config(includes platform name)
// * it generates host configs set and put it to build
gulp.task('solid', async function () {

  // TODO: сбилдить систему чтобы чтобы иметь последнюю версию

  if (!yargs.argv.name) {
    throw new Error(`You have to specify a "--name" params`);
  }

  const hostId: string = yargs.argv.name || 'master';
  const resolvedPath: string = resolveConfigPath(yargs.argv.config);
  const hostConfig: HostConfig = await readConfig<HostConfig>(resolvedPath);
  const hostSet = generateHostSet(hostConfig);
  const platformName: string = hostSet.platform;

  // TODO: global.__HOST_CONFIG_SET
  // TODO: сбилдить запускательный файл
  // TODO: global.__HOST_CONFIG_SET_MANAGER
  // TODO: global.__SYSTEM_CLASS

  // TODO: склеить запускательный файл, систему(уже сбилженную), конфиги и файлы entities
  // TODO: ??? как сбилдить файлы entitites??? они должны браться из файлов, но вставляться в структуру

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
