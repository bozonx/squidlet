import * as gulp from 'gulp';
import * as  concat from 'gulp-concat';
import * as path from 'path';

import solidTask from './solidTask';



// solid - build all in one file (system, host config, platform devs and config, entities files)
// * it receives name of host. Master by default. It needs if you want to get one host from a huge master config
// * it generates host configs set and put it to build
gulp.task('solid', async function () {
  solidTask();
});

gulp.task('conc', async function () {
  gulp.src([
    path.resolve(__dirname, './amdLoader.js'),
    path.resolve(__dirname, './build/solid/ts/**/*')
  ])
    .pipe(concat('result.js'))
    .pipe(gulp.dest(path.resolve(__dirname, './build/solid')));
});

//
//
// // build system with platform
// // * slave_x86
// // * slave_rpi
// // * slave_esp8266
// // * slave_esp32
// gulp.task('dist', function () {
//   // TODO: сделать slave билд под каждую платформу
//   // TODO: интегрировать config set manager для слейва
// });
//
//
// // slave
// // * receives hostId, master config
// // * get its own network config from master config
// // * generate minimum network config
// // * make build of platform specified in config and build network config into
// gulp.task('slave', function () {
//   // TODO: самая минимальная прошивка - сама система будет загружаться с мастера
// });





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




//  const tsProject = ts.createProject('tsconfig-builder.json');
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
