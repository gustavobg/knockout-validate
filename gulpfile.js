var  gulp = require('gulp'),
     browserSync = require('browser-sync').create(),
     sass = require('gulp-sass'),
     plumber = require('gulp-plumber'),
     qunit = require('gulp-qunit'),
     pkg = require('./package.json'),
     rename = require('gulp-rename'),
     clean = require('gulp-clean'),
     bump = require('gulp-bump'),
     minifyCss = require('gulp-minify-css'),
     git = require('gulp-git'),
     uglify = require('gulp-uglify');


gulp.task('default', function() {
    // place code for your default task here
});

// Static server
gulp.task('serve', function() {
    browserSync.init({
        server: {
            baseDir: "./src"
        }
    });
    gulp.watch("src/styles/*.scss", ['sass']);
    gulp.watch("src/*.html").on('change', browserSync.reload);
});

gulp.task('clean', function () {
    return gulp.src('./dist', { read: false })
        .pipe(clean());
});

gulp.task('build:js', function() {
    return gulp.src('./src/scripts/knockout-validate.js')
        .pipe(gulp.dest('./dist'))
        .pipe(uglify())
        .pipe(rename('knockout-validate.min.js'))
        .pipe(gulp.dest('./dist'))
});

gulp.task('build:css', function() {
    return gulp.src('./src/styles/knockout-validate.css')
        .pipe(gulp.dest('dist'))
        .pipe(minifyCss({compatibility: 'ie8'}))
        .pipe(rename('knockout-validate.min.css'))
        .pipe(gulp.dest('dist'));
});

gulp.task('build', ['build:css', 'build:js']);

gulp.task('bump', ['build'], function () {
    return gulp.src(['./package.json', './bower.json'])
        .pipe(bump())
        .pipe(gulp.dest('./'));
});

gulp.task('tag', ['bump'], function () {
    var pkg = require('./package.json');
    var v = 'v' + pkg.version;
    var message = 'Release ' + v;

    return gulp.src('./')
        .pipe(git.add({args: '--all'}))
        .pipe(git.commit(message))
        .pipe(git.tag(v, message))
        .pipe(git.push('origin', 'master', '--tags'))
        .pipe(gulp.dest('./'));
});

gulp.task('release', ['tag']);

// test
gulp.task('test', function() {
    return gulp.src('src/spec/index.html')
        .pipe(qunit());
});

// Compile sass into CSS & auto-inject into browsers
gulp.task('sass', function() {
    return gulp.src("src/styles/*.scss")
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest("src/styles"))
        .pipe(browserSync.stream());
});

gulp.task('default', ['serve']);

gulp.task('ci', ['test', 'build']);