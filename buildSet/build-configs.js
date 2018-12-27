const yargs = require('yargs');
const gulp = require('gulp');

require('./gulpfile');


if (yargs.argv.config) {
  process.env.CONFIG = yargs.argv.config;
}

if (yargs.argv['build-dir']) {
  process.env.BUILD_DIR = yargs.argv['build-dir'];
}

gulp.series('build-configs')();
