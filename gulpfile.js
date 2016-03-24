var gulp = require('gulp'),
	sass = require('gulp-sass'),
	del = require('del')

gulp.task('sass', ['sass:clean'], function() {
	return gulp.src('./source/sass/**/*.sass')
		.pipe(sass().on('error', sass.logError))
		.pipe(gulp.dest('./public/css'))
})

gulp.task('sass:clean', function() {
	return del('./public/sass')
})

gulp.task('watch', function(){
	gulp.watch('./source/sass/**', ['sass'])
})

gulp.task('default', ['sass', 'watch'])