// Application Entry Point. 
// Registers all HTTP API routes and starts the server

const PORT = 1904

console.log("Start setting up server")

import express from 'express'
import cookieParser from 'cookie-parser' //https://expressjs.com/en/resources/middleware/cookie-parser.html
import favicon from'serve-favicon'
const app = express()
app.use(express.json()) //Parses HTTP request body and populates req.body
app.use(cookieParser())
app.set('view engine', 'hbs') //https://expressjs.com/en/5x/api.html#app.settings.table:~:text=production%2C%20otherwise%20undefined.-,view%20engine,-String
app.set('views', './web/site/views/') //https://expressjs.com/en/5x/api.html#app.settings.table:~:text=false%20(disabled)-,views,-String%20or%20Array
app.use(favicon('./web/site/public/favicon.ico')) //https://expressjs.com/en/resources/middleware/serve-favicon.html
app.use(express.static('./web/site/public')) //https://expressjs.com/en/starter/static-files.html

//API
import * as api from './web/api/cmdb-web-api.mjs'
app.post('/api/users', api.signUpUser)
app.post('/api/login', api.loginUser) //delete?
app.post('/api/groups', api.createGroup)
app.put('/api/groups/:groupID/:movieID', api.addMovieToGroup)
app.get('/api/groups', api.getGroupList) //query params -> skip and limit
app.post('/api/groups/:groupID', api.updateGroup)
app.delete('/api/groups/:groupID', api.deleteGroup)
app.get('/api/groups/:groupID', api.getGroup)
app.delete('/api/groups/:groupID/:movieID', api.removeMovieFromGroup)

//IMDB calls
app.get('/movies', api.getTopMovies), //query params -> top
app.get('/movies/:searchTerms', api.searchMovie) //query params -> limit

// WEB
import site from './web/site/cmdb-web-site.mjs'
app.use('/', site)

//DOCS
import swaggerUi from 'swagger-ui-express'
import yaml from 'yamljs'
const swaggerDocument = yaml.load('../Docs/cmdb-api-spec.yaml')
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.listen(PORT, () => console.log(`Server listening in http://localhost:${PORT}`))

console.log("End setting up server")
