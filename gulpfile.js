var  gulp = require('gulp'),
     browserSync = require('browser-sync').create(),
     sass = require('gulp-sass'),
     plumber = require('gulp-plumber'),
     qunit = require('gulp-qunit'),
     pkg = require('./package.json'),
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


gulp.task('build', function() {
    return gulp.src('./src/knockout-validate.js')
        .pipe(gulp.dest('./dist'))
        .pipe(uglify())
});

gulp.task('release', function() {

});

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