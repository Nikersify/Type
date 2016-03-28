var	del = require('del')
var	sass = require('gulp-sass')
var browserify = require('browserify')
var gulp = require('gulp')
var gutil = require('gulp-util')
var source = require('vinyl-source-stream')
var through2 = require('through2')
var transform = require('vinyl-transform')
var vueify = require('vueify')
var watchify = require('watchify')

gulp.task('sass', ['sass:clean'], function() {
	return gulp.src('./source/sass/**/*.sass')
		.pipe(sass().on('error', sass.logError))
		.pipe(gulp.dest('./public/css'))
})

gulp.task('sass:clean', function() {
	return del('./public/sass')
})

gulp.task('bundle', function() {
	return scripts(false)
})

function scripts(watch) {
	var b = browserify('./source/js/entry.js', {
		basedir: __dirname, 
		debug: true, 
		cache: {},
		packageCache: {},
		fullPaths: watch
	})

	if(watch)
		b = watchify(b)

	b.transform(vueify)

	b.ignoreNext = watch

	var rebundle = function() {
		if(b.ignoreNext) {
			b.ignoreNext = false
			// for some reason watchify doesn't work 
			// if you omit .pipe() at the end of a stream...
			return b.bundle().pipe(require('dev-null')())
		} else {
			var c = gutil.colors
			gutil.log("Bundling '" + c.cyan('bundle.js') + "'...") 

			return b.bundle()
				.on('error', function() { console.log('oh well :|') })

				.pipe(source('bundle.js'))
				.pipe(gulp.dest('./public/js'))
		}
	};

	b.on('update', rebundle)
	b.on('time', function(time) { 
		var c = gutil.colors
		gutil.log("Rebundled '" + c.cyan('bundle.js') + "' in " + c.magenta(time/1000 + ' s')) 
	})

	return rebundle()
}

gulp.task('bundle:clean', function() {
	// the only glob that doesn't cause EPERM and I have no clue why
	return del('public/js/**.*.*')
})

gulp.task('watch', function(){
	gulp.watch('./source/sass/**', ['sass'])
	//gulp.watch(['./source/js/**', './source/vue/**'], ['bundle'])
	scripts(true)
})

gulp.task('default', ['sass', 'bundle', 'watch'])