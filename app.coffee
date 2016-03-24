express = require 'express'

app = express()

app.set 'view engine', 'jade'
app.use express.static 'public'

app.get 'favicon.ico', (req, res) ->
	res.send 0

app.get '/', (req, res) ->
	res.render 'index'

app.listen 3000