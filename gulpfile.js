var gulp = require('gulp');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var babel = require('gulp-babel');
var del = require('del');
var runSequence = require('run-sequence');
var watch = require('gulp-watch');
// uglify dependencies
var uglify = require('gulp-uglify');
var useref = require('gulp-useref');
var gulpIf = require('gulp-if');
var cssnano = require('gulp-cssnano');
// images dependencies
var imagemin = require('gulp-imagemin');
var cache = require('gulp-cache');

gulp.task('concat', function () {
  gulp.src('app_client/**/*.js')
    .pipe(sourcemaps.init())
    .pipe(concat('app.min.js'))
    .pipe(sourcemaps.write(''))
    .pipe(gulp.dest('public/dist'));
});

gulp.task('babel', function () {
  gulp.src('public/dist/app.min.js')
  // .pipe(sourcemaps.init())
  // .pipe(babel(''))
    .pipe(babel({
      presets: ['es2015'],
      minified: true,
      comments: false,
      babelrc: false 
    }))
  // .pipe(sourcemaps.write(''))
    .pipe(gulp.dest('public/dist'))
});

gulp.task('uglify', function () {
  return gulp.src('./app_client/*.html')
    .pipe(useref())
    .pipe(gulpIf('*.js', uglify()))
    .pipe(gulpIf('*.css', cssnano()))
    .pipe(gulp.dest('dist'))
});

gulp.task('sass', function (){
  return gulp.src('app/scss/styles.scss')
    .pipe(sass())
    .pipe(browserSync.reload({
      stream: true
    }))
    .pipe(gulp.dest('app/css'))
});

gulp.task('images', function () {
  return gulp.src('./public/img/ico/*.png')
    .pipe(cache(imagemin()))
    .pipe(gulp.dest('dist/images'))
});

gulp.task('watch', function () {
  watch(['./app_client/**/*.(js|html)',
    '!./app_client/app.min.js'], function () {
      gulp.start('dev');
    });
});

gulp.task('watch', ['browserSync', 'sass'], function () {
  gulp.watch(['./app_client/**/*.js', '!./app_client/app.min.js']);
  gulp.watch('./app_client/*.html');
  gulp.watch('./app_client/**/*.scss');
});

gulp.task('clean', function () {
  return del.sync('dist');
})

gulp.task('default', ['dev'])

gulp.task('dev', function (callback) {
  runSequence('concat', 'babel', callback);
});

gulp.task('prod', function (callback) {
  runSequence('concat', 'babel', ['uglify', 'sass', 'images'], ['watch'], callback);
});

