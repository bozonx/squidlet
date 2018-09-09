import * as path from 'path';
import * as gulp from 'gulp';
import * as yargs from 'yargs';
import * as ts from 'gulp-typescript';
import * as concat from 'gulp-concat';
import * as uglify from 'gulp-uglify';

import buildHostsConfigs from '../buildSet/buildHostsConfigs';
import generateMasterSet from '../buildSet/generateMasterSet';


const tsProject = ts.createProject('tsconfig.json');



// slave
// * receives hostId, master config
// * get its own network config from master config
// * generate minimum network config
// * make build of platform specified in config and build network config into
gulp.task('slave', function () {
  // return tsProject.src()
  //   .pipe(tsProject())
  //   .js
  //   .pipe(concat('all.js'))
  //   //.pipe(uglify())
  //   .pipe(gulp.dest('build'));

  // return gulp.src('./build/main.js')
  //   .pipe(concat('all.js'))
  //   //.pipe(uglify())
  //   .pipe(gulp.dest('build'));
});


// solid - build all in one file (system, host config, platform devs and config, entities files)
// * it receives name of host(default is master), host config(includes platform name)
// * if passed "master" - будут дббавленны соответствующие сервисы
// * it generates host configs set and put it to build
gulp.task('solid', function () {
  // return tsProject.src()
  //   .pipe(tsProject())
  //   .js
  //   .pipe(concat('all.js'))
  //   //.pipe(uglify())
  //   .pipe(gulp.dest('build'));

  // return gulp.src('./build/main.js')
  //   .pipe(concat('all.js'))
  //   //.pipe(uglify())
  //   .pipe(gulp.dest('build'));
});


// master:
// * receives master config
// * generate all the host files exclude master (these files will be sent to hosts)
// * generate files paths and configs to js object in memory
// * pass it to platform build
// * run host system as is, without building
(gulp.task as any)('master', ['generate-hosts-files'], function () {
  // if (!yargs.argv.config) {
  //   throw new Error(`You have to specify a "--config" params`);
  // }

  const configFile = yargs.argv.config;
  const masterSet = generateMasterSet(configFile);
  // TODO: проверить
  const platformName: string = masterSet.platform;

  // TODO: pass it to platform build
  // TODO: run master host as typescript without building


});


gulp.task('generate-hosts-files', async function () {
  return buildHostsConfigs(yargs.argv.config);
});


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
