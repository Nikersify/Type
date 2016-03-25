var app
var stats

DEVELOPMENT = true

Vue.config.debug = DEVELOPMENT
Vue.config.devtools = DEVELOPMENT

$(document).ready(function() {

	app = new Vue({
		el: '#app',
		data: {
			blurred: false,
			done: false,
			editor_height: 3,
			editor_width: 34,
			lines: [],
			mistakes: [],
			paused: false,
			pausedOn: NaN,
			stats_time: '00:00',
			stats_accuracy: '00.00',
			stats_wpm: '-',
			stats_progress: '0%',
			//text: 'kappa123',
			text: 'Lorem ąęóź dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
			typed: '',
			typedCorrect: [],
			timeTickInterval: undefined,
			unixStart: NaN,
			unixPaused: NaN
		},

		computed: {
			current_id: function() {
				return this.typed.length
			},

			charClasses: function() {
				var arr = []

				for(var i = 0; i < this.typed.length; i++) {

					if(this.typed[i] != this.text[i]) {
						arr.push('wrong')
					} else if(this.mistakes.indexOf(i) != -1) {
						arr.push('corrected')
					} else {
						arr.push('right')
					}
				}

				return arr
			},

			current_line: function() {
				var sum = 0
				var line = 0

				if(this.typed.length == this.text.length) {
					return this.lines.length - 1
				}

				for(var i = 0; i < this.lines.length; i++) {
					sum += this.lines[i].length
					
					if(sum > this.typed.length) {
						line = i
						break
					}
				}

				return line
			},

			lineLengths: function() {
				var arr = []
				
				for(var i = 0; i < this.lines.length; i++) {
					arr.push(this.lines[i].length)
				}

				return arr
			},

			stats_accuracy: function() {
				if(this.typed.length == 0) return '100.00'
				return (100 - (this.mistakes.length * 100/ this.typed.length)).toFixed(2)
			},

			stats_progress: function() {
				return (this.typed.length * 100 / this.text.length).toFixed(2) + '%'
			},

			textTransform: function() {
				var transformTo;

				if(this.current_line >= this.lines.length - this.editor_height)
					transformTo = this.lines.length - this.editor_height
				else 
					transformTo = this.current_line

				console.log(transformTo)

				var prop = 'translateY(calc((-3.375em - 3px) *' + transformTo +'))'

				return { transform: prop }
			},

			uncorrected: function() {
				var uncorrected = 0

				for(var i = 0; i < this.typed.length; i++) {
					if(this.typed[i] != this.text[i]) uncorrected++
				}

				return uncorrected
			}
		},

		methods: {
			getCharId: function(line_index, char_index) {
				var pre = 0
				for(var i = 0; i < line_index; i++) {
					pre += this.lines[i].length
				}

				return pre + char_index
			},

			pushMistake: function(id) {
				if(this.mistakes.indexOf(id) == -1) {
					this.mistakes.push(id)
				}
			},

			pushTypedCorrect: function(id) {
				if(this.typedCorrect.indexOf(id) == -1) {
					this.typedCorrect.push(id)
				}
			},

			start: function() {
				app.done = false

				this.mistakes = []
				this.typed = ''
				this.typedCorrect = []

				this.unixStart = new Date().getTime()

				that = this
				
				this.timeTickStart()
			},

			pause: function() {
				this.paused = true
				this.pausedOn = new Date().getTime() - this.unixStart
				
				this.timeTickStop()
			},

			resume: function() {
				var now = new Date().getTime()
				this.unixStart = now - this.pausedOn

				this.timeTickStart()

				this.paused = false
			},

			reset: function() {
				this.stop()

				this.mistakes = []
				this.paused = false
				this.pausedOn = NaN
				this.stats_time = '00:00'
				this.stats_accuracy = '00.00'
				this.stats_wpm = '-'
				this.stats_progress = '0%'

				this.typed = ''
				this.typedCorrect = []
				this.mistakes = []
			},

			stop: function() {
				this.timeTickStop()

				app.done = true
			},

			timeTick: function() {
				
				// time

				var time
				var start = new Date(this.unixStart)
				
				var delta = new Date( new Date() - start )
				
				if(!isNaN(this.unixStart))
					time = delta.toISOString().substr(14, 5)
				else time = '00:00'

				this.stats_time = time

				// wpm

				var seconds = (delta.getTime() / 1000)
				var minutes = seconds / 60

				var chars

				if(this.typedCorrect.length - this.mistakes.length < 0)
					chars = 0
				else chars = this.typedCorrect.length - this.mistakes.length

				var words = chars / 5

				var gross_wpm = (words/minutes).toFixed(0)

				var net_wpm = ((this.typed.length) / 5 - this.uncorrected) /  minutes

				var odd_wpm = (this.typedCorrect.length / 5) / minutes

				if(isNaN(odd_wpm)) this.stats_wpm = '-'
				else this.stats_wpm = odd_wpm.toFixed(0)
			},

			timeTickStart: function() {
				var that = this

				this.timeTickInterval = setInterval(function() {
					that.timeTick()
				}, 1000)
			},

			timeTickStop: function() {
				clearInterval(this.timeTickInterval)
			}
		}
	})

	// calculate lines

	var line_index = 0

	app.$set('lines[0]', '')

	for(var i = 0; i < app.text.length; i++) {
		if(app.text[i - 1] == ' ') {

			// next word length
			var len = 0
			
			for(var j = i + 1; ; j++) {
				if(app.text[j] == ' ' || j > app.text.length) break
				len++
			}

			if(app.lines[line_index].length + len + 1 >= app.editor_width) {
				line_index++
				app.$set('lines['+line_index+']', '')
			}
		}

		app.lines[line_index] += app.text[i]
	}

	// window/document events

	$(window).on('blur', function(e) {

		if(app.typed.length != 0) {
			app.blurred = true
			if(!app.paused) app.pause()
		}
	})

	$(window).on('focus', function(e) {
		
		if(app.typed.length != 0) {
			app.blurred = false
			if(app.paused) app.resume()
		}
	})

	$(document).on('keydown', function(e) {
		e = e || window.event

		var c = e.which || e.keyCode

		if(e.ctrlKey && !e.altKey) {
			
			// ctrl + [key] shortcuts
			switch(c) {
				case 65: // a
				case 83: // s
					e.preventDefault()
					console.log('shortcut ' + String.fromCharCode(c))
				break
			}
		}

		if(c == 8) {
			e.preventDefault()

			if(!app.done) {
				app.typed = app.typed.substring(0, app.typed.length - 1)

				if(app.typed.length == 0) {
					app.reset()
				}
			}
		}
	})
	
	$(document).on('keypress', function(e) {
		var c = e.which || e.keyCode
		
		if(!e.ctrlKey || e.altKey) {

			if(app.typed.length == 0)
				app.start()

			if(!app.done) {

				if(String.fromCharCode(c) != app.text[app.typed.length])
					app.pushMistake(app.typed.length)
				else app.pushTypedCorrect(app.typed.length)

				app.typed += String.fromCharCode(c)
				
				if(app.typed.length == app.text.length)
					app.stop()
			}
		}
	})
})