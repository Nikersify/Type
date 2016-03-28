// hi

// everything not scoped with var here is exposed globally to browser

DEVELOPMENT = true

var Vue = require('vue')
var $ = require('jquery')

Vue.config.debug = DEVELOPMENT
Vue.config.devtools = DEVELOPMENT

$(document).ready(function() {

	var playArena = require('./components/playArena.vue')

	app = new Vue({
		el: '#app',
		data: {
			// overrides go here
		},
		components: { playArena }
	})
})