const gulp = require("gulp");
const plumber = require("gulp-plumber");
const sourcemap = require("gulp-sourcemaps");
const sass = require("gulp-sass");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const csso = require("postcss-csso");
const rename = require("gulp-rename");
const htmlmin = require("gulp-htmlmin");
const uglify = require("gulp-uglify");
const imagemin = require("gulp-imagemin");
const del = require("del");
const gulpif = require("gulp-if");
const stylelint = require("gulp-stylelint");
const deploy = require("gulp-gh-pages");

const sync = require("browser-sync").create();

const lintScss = () => {
  return gulp.src("src/styles/**/*.scss").pipe(
    stylelint({
      reporters: [
        {
          failAfterError: true,
          formatter: "string",
          console: true,
        },
      ],
    })
  );
};

const tests = gulp.parallel(lintScss);
exports.tests = tests;

const env = process.env.NODE_ENV;
// Styles

const styles = () => {
  return gulp
    .src("src/styles/main.scss")
    .pipe(plumber())
    .pipe(gulpif(env === "dev", sourcemap.init()))
    .pipe(sass())
    .pipe(postcss([autoprefixer(), csso()]))
    .pipe(rename("main.min.css"))
    .pipe(gulpif(env === "dev", sourcemap.write(".")))
    .pipe(gulp.dest("dist/css"))
    .pipe(sync.stream());
};

exports.styles = styles;

// HTML

const html = () => {
  return gulp
    .src("src/*.html")
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest("dist"));
};

// Scripts

const scripts = () => {
  return gulp
    .src("src/js/main.js")
    .pipe(uglify())
    .pipe(rename("main.min.js"))
    .pipe(gulp.dest("dist/js"))
    .pipe(sync.stream());
};

exports.scripts = scripts;

// Images

const images = () => {
  return gulp
    .src("src/img/**/*.{png,jpg,svg}")
    .pipe(
      imagemin([
        imagemin.mozjpeg({ progressive: true }),
        imagemin.optipng({ optimizationLevel: 3 }),
        imagemin.svgo(),
      ])
    )
    .pipe(gulp.dest("src/img"));
};

exports.images = images;

// Copy
const copy = (done) => {
  gulp
    .src(
      ["src/fonts/*.{woff2,woff}", "src/*.ico", "src/img/**/*.{jpg,png,svg}"],
      {
        base: "src",
      }
    )
    .pipe(gulp.dest("dist"));
  done();
};

exports.copy = copy;

// Clean

const clean = () => del("dist");

// Server

const server = (done) => {
  sync.init({
    server: {
      baseDir: "dist",
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
};

exports.server = server;

// Reload

const reload = (done) => {
  sync.reload();
  done();
};

// Watcher

const watcher = () => {
  gulp.watch("src/styles/**/*.scss", gulp.series(styles));
  gulp.watch("src/js/script.js", gulp.series(scripts));
  gulp.watch("src/*.html", gulp.series(html, reload));
};

// Build

const build = gulp.series(
  clean,
  gulp.parallel(styles, html, scripts, copy, images)
);

exports.build = build;

// Deploy

const deployApp = () => {
  return gulp.src("./dist/**/*").pipe(deploy());
};

const deployToGH = gulp.series(build, deployApp);

exports.deploy = deployToGH;

// Default

exports.default = gulp.series(
  clean,
  gulp.parallel(styles, html, scripts, copy),
  gulp.series(server, watcher)
);
