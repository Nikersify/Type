<template lang="jade">

.progress-wrap
	.progress(v-bind:style='{width: stats_progress}')

.numbers
	.time
		i.fa.fa-clock-o
		|  {{ stats_time }}
	.wpm
		.amount {{ stats_wpm }}
		.muted wpm
	.accuracy 
		| {{ stats_accuracy }}<span class='muted'>%</span> 
		i.fa.fa-crosshairs

.editor() 
	//- :style='{display: (done)? "none" : ""}'
	.overlay(:style='{display: (!blurred || done)? "none" : "flex"}')
		
		.message re-focus to resume typing...
	
	.text(:style='textTransform')
		
		.line(v-for='line in lines'
		track-by='$index'
		id='line-{{ $index }}')
			
			span.char(v-for='char in line'
			track-by='$index'
			id='char-{{ getCharId($parent.$index, $index) }}' 
			:class='[charClasses[getCharId($parent.$index, $index)], (char == " ")? "space" : "", (getCharId($parent.$index, $index) == current_id)? "current" : ""]')
				| {{ (char == ' ')? "&middot;" : char }}

</template>

<script>

var $ = require('jquery')

module.exports = {
	data: function() { 
		return {
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
		}
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

			if(this.current_line >= this.lines.length - this.editor_height 
				&& this.lines.length > 3)
				transformTo = this.lines.length - this.editor_height
			else 
				transformTo = this.current_line

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
			var self = this

			this.timeTickInterval = setInterval(function() {
				self.timeTick()
			}, 1000)
		},

		timeTickStop: function() {
			clearInterval(this.timeTickInterval)
		}
	},

	created: function() {

		// calculate lines

		var line_index = 0

		this.$set('lines[0]', '')

		for(var i = 0; i < this.text.length; i++) {
			if(this.text[i - 1] == ' ') {

				// next word length
				var len = 0
				
				for(var j = i + 1; ; j++) {
					if(this.text[j] == ' ' || j > this.text.length) break
					len++
				}

				if(this.lines[line_index].length + len + 1 >= this.editor_width) {
					line_index++
					this.$set('lines['+line_index+']', '')
				}
			}

			this.lines[line_index] += this.text[i]
		}

		// window/document events

		var self = this

		$(window).on('blur.editor' /* editor - namespace */, function(e) {

			if(self.typed.length != 0 && !self.done) {
				self.blurred = true
				if(!self.paused) self.pause()
			}
		})

		$(window).on('focus.editor', function(e) {
			
			if(self.typed.length != 0 && !self.done) {
				self.blurred = false
				if(self.paused) self.resume()
			}
		})

		$(document).on('keydown.editor', function(e) {
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

				if(!self.done) {
					self.typed = self.typed.substring(0, self.typed.length - 1)

					if(self.typed.length == 0) {
						self.reset()
					}
				}
			}
		})
		
		$(document).on('keypress.editor', function(e) {
			var c = e.which || e.keyCode
			console.log(c)
			
			if(!e.ctrlKey || e.altKey) {

				if(self.typed.length == 0)
					self.start()

				if(!self.done) {

					if(String.fromCharCode(c) != self.text[self.typed.length])
						self.pushMistake(self.typed.length)
					else self.pushTypedCorrect(self.typed.length)

					self.typed += String.fromCharCode(c)
					
					if(self.typed.length == self.text.length)
						self.stop()
				}
			}
		})

	},

	beforeDestroy: function() {
		
		// unbind events
		$(window).off('blur.editor')
		$(window).off('focus.editor')
		$(document).off('keydown.editor')
		$(document).off('keypress.editor')

	}
}

</script>