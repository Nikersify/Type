var	del = require('del')
var	sass = require('gulp-sass')
var browserify = require('browserify')
var gulp = require('gulp')
var transform = require('vinyl-transform')
var through2 = require('through2')
var vueify = require('vueify')

gulp.task('sass', ['sass:clean'], function() {
	return gulp.src('./source/sass/**/*.sass')
		.pipe(sass().on('error', sass.logError))
		.pipe(gulp.dest('./public/css'))
})

gulp.task('sass:clean', function() {
	return del('./public/sass')
})

gulp.task('bundle', ['bundle:clean'], function() {
	return gulp.src('./source/js/entry.js')
		.pipe(through2.obj(function (file, end, next) {
			browserify(file.path, {debug: true})
				//.transform('uglify')
				.transform(vueify)
				.bundle(function(err, res) {
					file.contents = res
					next(null, file)
				})
		}))
		.pipe(require('gulp-rename')('bundle.js'))
		.pipe(gulp.dest('./public/js/'))
})

gulp.task('bundle:clean', function() {
	return del('./public/js')
})

gulp.task('watch', function(){
	gulp.watch('./source/sass/**', ['sass'])
	gulp.watch(['./source/js/**', './source/vue/**'], ['bundle'])
})

gulp.task('default', ['sass', 'bundle', 'watch'])