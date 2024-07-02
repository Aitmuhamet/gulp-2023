const { src, dest, watch, parallel, series } = require("gulp");

const scss = require("gulp-sass")(require("sass"));
const concat = require("gulp-concat");
const uglify = require("gulp-uglify-es").default;
const browserSync = require("browser-sync").create();
const autoPrefixer = require("gulp-autoprefixer");
const clean = require("gulp-clean");
const avif = require("gulp-avif");
const webp = require("gulp-webp");
const imagemin = require("gulp-imagemin");
const newer = require("gulp-newer");
const fonter = require("gulp-fonter");
const ttf2woff2 = require("gulp-ttf2woff2");
const svgSprite = require("gulp-svg-sprite");
const gulpInclude = require("gulp-include");
const replace = require("gulp-replace");


function pages() {
  return src('app/pages/**/*.html')
    .pipe(gulpInclude({
      includePaths: 'app/components'
    }))
    .pipe(replace('../', ''))
    .pipe(dest('app'))
    .pipe(browserSync.stream())
}

function buildFonts() {
  return src('app/fonts/src/*.*')
    .pipe(fonter({
      formats: ['woff', 'ttf']
    }))
    .pipe(src('app/fonts/*.ttf'))
    .pipe(ttf2woff2())
    .pipe(dest('app/fonts'))
}

function buildImages() {
  return src(["app/images/src/*.*", "!app/images/src/*.svg"])
    .pipe(newer("app/images"))
    .pipe(avif({ quality: 50 }))

    .pipe(src("app/images/src/*.*"))
    .pipe(newer("app/images"))
    .pipe(webp())

    .pipe(src("app/images/src/*.*"))
    .pipe(newer("app/images"))
    .pipe(imagemin())

    .pipe(dest("app/images"));
}

function sprite() {
  return src('app/images/*.svg')
    .pipe(svgSprite({
      mode: {
        stack: {
          sprite: '../sprite.svg',
          example: true
        }
      }
    }))
    .pipe(dest('app/images'))
}

function buildStyles() {
  return src("app/scss/style.scss")
    .pipe(
      autoPrefixer({
        overrideBrowserslist: ["last 8 version"],
      })
    )
    .pipe(concat("style.min.css"))
    .pipe(scss({ outputStyle: "compressed" }))
    .pipe(dest("app/css"))
    .pipe(browserSync.stream());
}

function buildScripts() {
  return src(["node_modules/swiper/swiper-bundle.js", "app/js/main.js"])
    .pipe(concat("main.min.js"))
    .pipe(uglify())
    .pipe(dest("app/js"))
    .pipe(browserSync.stream());
}

function watching() {
  browserSync.init({
    server: {
      baseDir: "app/",
    },
  });
  watch(["app/scss/style.scss"], buildStyles);
  watch(["app/images/src/*"], buildImages);
  watch(["app/js/main.js"], buildScripts);
  watch(["app/components/*", "app/pages/*"], pages);
  watch(["app/**/*.html"]).on("change", browserSync.reload);
}

function cleanDist() {
  return src("dist", { allowEmpty: true }).pipe(clean());
}

function building() {
  return src(
    [
      "app/css/style.min.css",
      "app/images/*.*",
      "!app/images/*.svg",
      "!app/images/stack/sprite.stack.html",
      "app/images/sprite.svg",
      "app/fonts/*.*",
      "app/js/main.min.js",
      "app/**/*.html",
    ],
    {
      base: "app",
    }
  ).pipe(dest("dist"));
}

exports.buildFonts = buildFonts;

exports.buildStyles = buildStyles;
exports.buildImages = buildImages;
exports.buildScripts = buildScripts;
exports.pages = pages;
exports.watching = watching;
exports.sprite = sprite;

exports.build = series(cleanDist, building);
exports.default = parallel(buildStyles, buildImages, buildScripts, pages, watching);
