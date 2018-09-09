import * as path from 'path';
import * as gulp from 'gulp';
import * as yargs from 'yargs';
import * as ts from 'gulp-typescript';
import * as concat from 'gulp-concat';
import * as uglify from 'gulp-uglify';

import masterIndex from '../buildSet/masterIndex';
import slaveIndex from '../buildSet/slaveIndex';
import solidIndex from '../buildSet/solidIndex';
import {loadYamlFile} from '../IO';
import MasterConfig from '../MasterConfig';
import HostConfig from '../../host/src/app/interfaces/HostConfig';


function resolveConfigPath(pathToYamlFile?: string): string {
  if (!pathToYamlFile) {
    console.error(`You have to specify a "--config" param`);

    process.exit(3);
  }

  return path.resolve(process.cwd(), (pathToYamlFile as string));
}

async function readConfig<T> (resolvedPath: string): Promise<T> {
  return await loadYamlFile(resolvedPath) as T;
}


// build system with platform
// * slave_x86
// * slave_rpi
// * slave_esp8266
// * slave_esp32
gulp.task('dist', function () {

});


// slave
// * receives hostId, master config
// * get its own network config from master config
// * generate minimum network config
// * make build of platform specified in config and build network config into
gulp.task('slave', function () {
  // TODO: самая минимальная прошивка - сама система будет загружаться с мастера
});


gulp.task('solid', async function () {

  // TODO: сбилдить систему чтобы чтобы иметь последнюю версию

  if (!yargs.argv.name) {
    throw new Error(`You have to specify a "--name" params`);
  }

  const resolvedPath: string = resolveConfigPath(yargs.argv.config);
  const hostConfig: HostConfig = await readConfig<HostConfig>(resolvedPath);

  await solidIndex(hostConfig);
});


gulp.task('master', async function () {

  // TODO: сбилдить систему чтобы рассылать ее потом слейвам

  const resolvedPath: string = resolveConfigPath(yargs.argv.config);
  const config: MasterConfig = await readConfig<MasterConfig>(resolvedPath);

  await masterIndex(config);
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
