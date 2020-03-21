'use strict';

// nastavení
var settings = {
  browsersync: {
    url: 'http://erouska.test/',
    watch: ['*.html', '*.htm', '*.php']
  },
  css: {
    source: 'css/styles.scss',
    target: 'css/',
    filename: 'styles.css',
    watch: ['css/**/*.scss', 'css/**/*.css', '!css/styles.css'],
    components: ['css/base/**/*.scss', '!css/base/print.scss', '!css/base/variables.scss', 'css/components/**/*.scss']
  },
  js: {
    source: ['js/main.js'],
    target: 'js/',
    filename: 'scripts.js',
    watch: ['js/**/*.js', '!js/scripts.js'],
    components: ['js/components/**/*.js', 'js/main.js']
  },
  img: {
    source: 'img/**/*.{gif,jpg,jpeg,png}',
    target: 'img'
  }
};

// gulp
var gulp = require('gulp');
  // spojení souborů
  var concat = require('gulp-concat');
  // Cheerio - manipulace v HTML/XML souborech
  var cheerio = require('cheerio')
  // plumber - odchycení chybových hlášek
  var plumber = require('gulp-plumber');
  // přejmenování souborů
  var rename = require("gulp-rename");
  // sourcemaps - generování map zdrojů
  var sourcemaps = require('gulp-sourcemaps');
  // through2 - Node wrapper
  var through2 = require('through2');
  // Vinyl - konvertor streamu
  var Vinyl = require('vinyl');
// BrowserSync - live realod, server, ovládání prohlížeče
var browsersync = require('browser-sync');
// SASS - generování CSS z preprocesoru
var sass = require('gulp-sass');
// postCSS - postprocessing CSS (minifikace, autoprefixer...)
var postcss = require('gulp-postcss');
  var autoprefixer = require('autoprefixer');
  var cssnano = require('cssnano');
  var flexbugs = require('postcss-flexbugs-fixes');
  var pxtorem = require('postcss-pxtorem');
// CSScomb - uhlazení SASS souborů (řazení vlastností, odsazení...)
var csscomb = require('gulp-csscomb');
// lintování CSS
var stylelint = require('gulp-stylelint');
// minifikace JavaScriptu
var uglify = require('gulp-uglify');
// lintování JavaScriptu
var jshint = require('gulp-jshint');
// Prettier - uhlazení JS souborů
var prettier = require('gulp-prettier');
// Imagemin - optimalizace obrázků
var imagemin = require('gulp-imagemin');
// generování SVG spritů a ikon
var svgstore = require('gulp-svgstore');
// minimalizace SVG
var svgmin = require('gulp-svgmin');

// postCSS pluginy a nastavení
var postcssPlugins = [
  flexbugs(),
  pxtorem(),
  autoprefixer(),
  cssnano()
];

// výpis chybových hlášek
var onError = function (err) {
  console.log(err);
  this.emit('end');
};

// nastavení BrowserSync
gulp.task('browser-sync', function() {
  browsersync({
    proxy: settings.browsersync.url
  });
});

// BrowserSync live-reload
gulp.task('browsersync-reload', function () {
    browsersync.reload();
});

// SASS kompilace
gulp.task('sass', function() {
  return gulp.src(settings.css.source)
    .pipe(plumber({ errorHandler: onError }))
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(rename(settings.css.filename))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(settings.css.target))
    .pipe(browsersync.reload({ stream: true }));
});

// CSS kompilace (produkce)
gulp.task('makecss', ['csscomb'], function() {
  return gulp.src(settings.css.source)
    .pipe(plumber({ errorHandler: onError }))
    .pipe(sourcemaps.init())
    .pipe(sass({ style: 'expanded' }))
    .pipe(postcss(postcssPlugins))
    .pipe(rename(settings.css.filename))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(settings.css.target));
});

// CSScomb - úpravy SASS souborů (řazení vlastností, odsazení...)
gulp.task('csscomb', function() {
  return gulp.src(settings.css.components, { base: './' })
    .pipe(plumber({ errorHandler: onError }))
    .pipe(csscomb())
    .pipe(gulp.dest('./'));
});

// CSS - lintování (Stylelint)
gulp.task('stylelint', ['makecss'], function() {
  return gulp.src(settings.css.components, { base: './' })
    .pipe(plumber({ errorHandler: onError }))
    .pipe(stylelint({
      reporters: [
        {
          formatter: 'string',
          console: true
        }
      ]
    }));
});

// JavaScript - spojení souborů
gulp.task('concatjs', ['prettier'], function() {
  return gulp.src(settings.js.source, { base: './' })
    .pipe(plumber({ errorHandler: onError }))
    .pipe(sourcemaps.init())
    .pipe(concat(settings.js.target + settings.js.filename))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./'))
    .pipe(browsersync.reload({ stream: true }));
});

// JavaScript - spojení a minifikace (produkce)
gulp.task('makejs', ['concatjs'], function() {
  return gulp.src(settings.js.target + settings.js.filename, { base: './' })
    .pipe(plumber({ errorHandler: onError }))
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./'));
});

// JavaScript - lintování
gulp.task('jslint', ['makejs'], function() {
  return gulp.src(settings.js.components)
    .pipe(plumber({ errorHandler: onError }))
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(jshint.reporter('fail'));
});

// Prettier - uhlazení JS souborů
gulp.task('prettier', function() {
  return gulp.src(settings.js.components, { base: './' })
    .pipe(plumber({ errorHandler: onError }))
    .pipe(prettier({ singleQuote: true }))
    .pipe(gulp.dest('./'));
});

// optimalizace obrázků
gulp.task('images', function() {
  return gulp.src(settings.img.source)
    .pipe(plumber({ errorHandler: onError }))
    .pipe(imagemin({
      interlaced: true,
      pngquant: true,
      progressive: true
    }))
    .pipe(gulp.dest(settings.img.target))
});

// sledování změn souborů
gulp.task('watch', ['browser-sync'], function () {
  gulp.watch(settings.css.watch, ['sass']);
  gulp.watch(settings.js.watch, ['concatjs', 'browsersync-reload']);
  gulp.watch(settings.browsersync.watch, ['browsersync-reload']);
});

// aliasy tasků
  // úpravy před nahráním do produkce
  gulp.task('deploy', ['stylelint', 'jslint', 'images']);
  // defaultni task
  gulp.task('default', ['watch']);
