// Application Entry Point. 
// Registers all HTTP API routes and starts the server

export const PORT = 1904

export const ELASTIC_SEARCH = "http://localhost:9200"
export const isDataSourceElastic = true

console.log("Start setting up server")

import { createOurIndexes } from './data/cmdb-data-elastic.mjs'
if(isDataSourceElastic) createOurIndexes()

import express from 'express'
import hbs from 'hbs'
import cors from 'cors'
import cookieParser from 'cookie-parser' //https://expressjs.com/en/resources/middleware/cookie-parser.html
import favicon from'serve-favicon'

const app = express()
//Middleware setup
app.use(cors()) //Allows requests to skip the Same-origin policy and access resources from remote hosts https://blog.knoldus.com/a-guide-to-cors-in-node-js-with-express/#:~:text=start%20to%20learn%3A-,What%20is%20CORS%3F,-CORS%20stands%20for
app.use(express.json()) //Parses HTTP request body and populates req.body
app.use(express.urlencoded({extended: true})) // for parsing application/x-www-form-urlencoded
app.use(cookieParser())

app.set('view engine', 'hbs') //https://expressjs.com/en/5x/api.html#app.settings.table:~:text=production%2C%20otherwise%20undefined.-,view%20engine,-String
hbs.registerPartials('./web/site/views/partials') // In order for things like '{{> group}}' to work inside .hbs files https://stackoverflow.com/a/40583205/9375488
hbs.registerHelper('function_addMovieToGroupSetURL', function() { //https://handlebarsjs.com/guide/#custom-helpers Im oblitated to setup these helpers here or it doesnt work apparently...
    return shadowWebRoutes.addMovieToGroup.setUrl //we could avoid using this helper, we're just trying it out. And we actually learned new things by using this
})
app.set('views', './web/site/views/') //https://expressjs.com/en/5x/api.html#app.settings.table:~:text=false%20(disabled)-,views,-String%20or%20Array

app.use(favicon('./web/site/public/favicon.ico')) //https://expressjs.com/en/resources/middleware/serve-favicon.html
app.use(express.static('./web/site/public')) //https://expressjs.com/en/starter/static-files.html

//API
import * as api from './web/api/cmdb-web-api.mjs'
export const apiPath = "/api"

export const apiRoutes = { //TODO: review isto tem de estar aqui pq?
    getGroups: apiPath+'/groups'
}

app.post(apiPath+'/users', api.signUpUser)
app.post(apiPath+'/login', api.loginUser) //delete?
app.post(apiPath+'/groups', api.createGroup)
app.put(apiPath+'/groups/:groupID/:movieID', api.addMovieToGroup)
app.get(apiRoutes.getGroups, api.getGroupList) //query params -> skip and limit
app.post(apiPath+'/groups/:groupID', api.updateGroup)
app.delete(apiPath+'/groups/:groupID', api.deleteGroup)
app.get(apiPath+'/groups/:groupID', api.getGroup)
app.delete(apiPath+'/groups/:groupID/:movieID', api.removeMovieFromGroup)

//IMDB calls
app.get(apiPath+'/movies/top', api.getTopMovies), //query params -> top
app.get(apiPath+'/movies/search', api.searchMovie) //query params -> pathParam and limit
app.get(apiPath+'/movies/:movieID', api.getMovie)
app.get(apiPath+'/actor/:actorID', api.getActor)


// WEB
import site, { shadowWebRoutes } from './web/site/cmdb-web-site.mjs'
app.use('/', site)

//DOCS
import swaggerUi from 'swagger-ui-express'
import yaml from 'yamljs'
const swaggerDocument = yaml.load('../Docs/cmdb-api-spec.yaml')
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.listen(PORT, () => console.log(`Server listening in http://localhost:${PORT}`))

console.log("End setting up server")
