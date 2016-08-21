var gulp = require('gulp'),
    gulpif = require('gulp-if'),
    gutil = require('gulp-util'),
    webserver = require('gulp-webserver'),

    stylish = require('jshint-stylish'),
    jshint = require('gulp-jshint'),
    w3cjs = require('gulp-w3cjs'),
    webpack = require('webpack-stream'),

    htmlmin = require('gulp-htmlmin'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),

    sass = require('gulp-sass'),

    postcss = require('gulp-postcss'),
    precss = require('precss'),
    mqpacker = require('css-mqpacker'),
    cssnano = require('cssnano'),
    animation = require('postcss-animation'),

    sourcemaps = require('gulp-sourcemaps'),
    autoprefixer = require('autoprefixer'),

    cssfont64 = require('gulp-cssfont64'),

    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    pngcrush = require('imagemin-pngcrush'),

    rtlcss = require('gulp-rtlcss'),
    rename = require('gulp-rename'),

    postCSSsource = 'process/',
    dest = '.',
    env,
    jsSources,
    sassSources,
    htmlSources,
    outputDir,
    sassStyle;

//env = 'development';
env = 'production';

if (env==='development') {
    outputDir = 'builds/development/';
    sassStyle = 'expanded';
} else {
    outputDir = 'builds/production/';
    sassStyle = 'compressed';
}

jsSources = [
    'components/scripts/jqloader.js',
    'components/scripts/script.js'
];

sassSources = ['components/sass/style.scss'];
htmlSources = [outputDir + '*.html'];

gulp.task('js', function() {
    'use strict';

    gulp.src('components/scripts/script.js')
       .pipe(jshint('./.jshintrc'))
       .pipe(jshint.reporter('jshint-stylish'));

    gulp.src(jsSources)
        .pipe(sourcemaps.init({loadMaps: true}))
        //.pipe(concat('script.js'))
        .pipe(webpack({
            output: {
                filename: 'script.js'
            }
            //devtool: 'source-map'
        }))
        .on('error', gutil.log)
        .pipe(gulpif(env === 'production', uglify()))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(outputDir + 'js'))
});

gulp.task('html', function () {
    gulp.src(dest + '**/*.html')
    .pipe(gulpif(env === 'production', htmlmin({collapseWhitespace: true})))
        .pipe(gulpif(env === 'production', gulp.dest(outputDir)));
});

gulp.task('sass', function () {
    gulp.src(sassSources)
        .pipe(sass.sync().on('error', sass.logError))
        .pipe(gulp.dest(postCSSsource + 'from-sass'))
});

gulp.task('css', function () {
    gulp.src(postCSSsource + 'style.postcss')
        .pipe(rename('style.css'))
        .pipe(sourcemaps.init())
        .pipe(postcss([
            precss(),
            animation(),
            autoprefixer('last 5 version'),
            mqpacker(),
            cssnano()

        ]))
        .on('error', gutil.log)
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('css/'))

});

//gulp.task('watch', function () {
//    gulp.watch(jsSources, ['js']);
//    gulp.watch(['components/sass/*.scss', 'components/sass/**/*.scss'], ['sass']);
//    gulp.watch(postCSSsource + '**/*.css', ['css']);
//    gulp.watch(dest + '**/*.html', ['html']);
//});
 gulp.task('watch', function () {
    gulp.watch(postCSSsource + '**/*.css', ['css']);
});

gulp.task('webserver', function () {
    gulp.src(outputDir)
        .pipe(webserver({
            livereload: true,
            open: true
        }));
});

//gulp.task('default', ['html', 'js', 'sass', 'css', 'webserver', 'watch']);
gulp.task('default', [ 'css', 'watch']);

gulp.task('images', function () {
    gulp.src(['builds/development/images/**/*.png','builds/development/images/**/*.jpg'])
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [
                {removeViewBox: false},
                {cleanupIDs: false}
            ],
            use: [pngquant(), pngcrush()]
        }))
        .pipe(gulpif(env === 'production', gulp.dest(outputDir + 'images')))
});

gulp.task('fonts', function () {
    gulp.src('builds/development/assets/fonts/*.ttf')
        .pipe(cssfont64())
        .pipe(gulp.dest(postCSSsource + 'fonts/'));
});

gulp.task('ltr', function () {
    return gulp.src(dest + 'css/style.css')
        .pipe(rtlcss())
        .pipe(rename({suffix: '-ltr'}))
        .pipe(gulp.dest(dest + 'css/'));
});


/* npm i jshint-stylish gulp-jshint gulp-w3cjs gulp-if gulp-htmlmin gulp-concat gulp-uglify gulp-sass jquery jquery-ui jquery-scrollify material-design-lite malihu-custom-scrollbar-plugin --save-dev
 */
