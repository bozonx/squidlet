const exec = require('child_process').exec;
const path = require('path');
const gulp = require('gulp');
const yargs = require('yargs');
const ts = require('gulp-typescript');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');

const tsProject = ts.createProject('tsconfig.json');


// slave
// * receives hostId, master config
// * get its own network config from master config
// * generate minimum network config
// * make build of platform specified in config and build network config into

// solid - build all in one file (system, host config, platform devs and config, entities files)
// * it receives name of host(default is master), host config(includes platform name)
// * if passed "master" - будут дббавленны соответствующие сервисы
// * it generates host configs set and put it to build



gulp.task('default', function () {
  return tsProject.src()
    .pipe(tsProject())
    .js
      .pipe(concat('all.js'))
      //.pipe(uglify())
      .pipe(gulp.dest('build'));

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
gulp.task('master', ['generate-hosts-files'], function () {
  // if (!yargs.argv.config) {
  //   throw new Error(`You have to specify a "--config" params`);
  // }

  const configFile = yargs.argv.config;




  console.log(22222, yargs.argv)

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


gulp.task('generate-hosts-files', function (cb) {
  const cmd = `ts-node ${path.resolve(__dirname, '../index.ts')} --config ${yargs.argv.config}`;
  exec(cmd, function(error, stdout, stderr) {
    console.info(stdout);

    if (stderr) console.error(stderr);

    if (error) return cb(error); // return error
    cb(); // finished task
  });
});
