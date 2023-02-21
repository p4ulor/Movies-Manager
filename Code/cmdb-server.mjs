// Application Entry Point. 
// Registers all HTTP API routes and starts the server

console.log("Start setting up server")

// Dependencies imports
import express from 'express'
import expressSession from 'express-session' //because passport uses expressSession
import passport from 'passport' 
import hbs from 'hbs'
import cors from 'cors'
import cookieParser from 'cookie-parser' //https://expressjs.com/en/resources/middleware/cookie-parser.html
import favicon from 'serve-favicon'

import * as path from 'node:path'

//My files imports
import * as theApi from './web/api/cmdb-web-api.mjs'
export const apiPath = "/api"
export const apiRoutes = { //because cmdb-web-site need to know some (only this one in this case) api routes because of the client-side fetch()
    getGroups: apiPath+'/groups'
}

//WEB
import webSite, { shadowWebRoutes } from './web/site/cmdb-web-site.mjs'

//DOCS
import swaggerUi from 'swagger-ui-express'
import yaml from 'yamljs'

/** @param {ServerConfig} config */
export function server(config){ //in order be to be used in tests and be more flexible

    if(!config instanceof ServerConfig) throw new Error("A ServerConfig must be provided")

    const PORT = config.port
    const api = theApi.default(config)
    const app = express() //it has 'export' 

    // Session config
    app.use(expressSession( //https://www.passportjs.org/tutorials/password/session/#:~:text=%27public%27)))%3B-,app.use(session(%7B,-secret%3A%20%27keyboard
        {
            secret: "Group4",
            resave: false,
            saveUninitialized: false
            //store: new FileStore()
        }
    ))

    // Passport Initialization https://www.npmjs.com/package/passport#:~:text=%7D)%3B-,Middleware,-To%20use%20Passport
    app.use(passport.session())
    app.use(passport.initialize())

    //Passport-Session serialization https://www.npmjs.com/package/passport#:~:text=at%3A%20passportjs.org-,Sessions,-Passport%20will%20maintain
    passport.serializeUser((user, done) => done(null, user))
    passport.deserializeUser((user, done) => done(null, user))

    /**
     * @param {express.Request} req 
     * @param {express.Response} rsp 
     * @param {Function} next 
     */
    function authorizationMw(req, rsp, next) { //#passport 
        console.log('authorizationMw -> Authorization?', req.get('Authorization'))
        
        if(req.get('Authorization')){
            console.log("Authorization ->", req.get('Authorization').split(' ')[1])
            req.user = {
                token: req.get('Authorization').split(' ')[1]
            }
        } else if(req.cookies) {
            console.log('authorizationMw -> Cookie?', req.cookies.token)
            req.user = {
                token: req.cookies.token
            }
        } else {
            console.log("no cookies")
        }
        next()
    }

    //Middleware setup
    app.use(cors()) //Allows requests to skip the Same-origin policy and access resources from remote hosts https://blog.knoldus.com/a-guide-to-cors-in-node-js-with-express/#:~:text=start%20to%20learn%3A-,What%20is%20CORS%3F,-CORS%20stands%20for
    app.use(express.json()) //Parses the HTTP request body and puts it in req.body
    app.use(express.urlencoded({extended: true})) // for parsing application/x-www-form-urlencoded, in cases where a POST or GET is performed in the context of a HTML form
    app.use(cookieParser())

    app.set('view engine', 'hbs') //https://expressjs.com/en/5x/api.html#app.settings.table:~:text=production%2C%20otherwise%20undefined.-,view%20engine,-String
    hbs.registerPartials('./web/site/views/partials') // In order for things like '{{> group}}' to work inside .hbs files https://stackoverflow.com/a/40583205/9375488
    hbs.registerHelper('function_addMovieToGroupSetURL', function() { //https://handlebarsjs.com/guide/#custom-helpers Im oblitated to setup these helpers here or it doesnt work apparently...
        return shadowWebRoutes.addMovieToGroup.setUrl //we could avoid using this helper, we're just trying it out. And we actually learned new things by using this
    })
    app.set('views', './web/site/views/') //https://expressjs.com/en/5x/api.html#app.settings.table:~:text=false%20(disabled)-,views,-String%20or%20Array

    app.use(favicon('./web/site/public/favicon.ico')) //https://expressjs.com/en/resources/middleware/serve-favicon.html
    app.use(express.static('./web/site/public')) //https://expressjs.com/en/starter/static-files.html
    app.use('/', authorizationMw) //this must be placed after the other "uses()" or things like req.cookie won't work

    app.use('/js', express.static(path.resolve("../Code/web/site/scripts/").replace(/\\/g, '/'))) //https://stackoverflow.com/a/55279238/9375488   https://stackoverflow.com/a/60395362/9375488 Allows the successful use of <script src="/js/client-fetch.js"></script> inside .hbs files

    //API
    app.post(apiPath+'/users', api.signUpUser)
    app.post(apiPath+'/login', api.loginUser)
    app.post(apiPath+'/groups', api.createGroup)
    app.put(apiPath+'/groups/:groupID/:movieID', api.addMovieToGroup)
    app.get(apiRoutes.getGroups, api.getGroupList) //query params -> skip and limit
    app.post(apiPath+'/groups/:groupID', api.updateGroup)
    app.delete(apiPath+'/groups/:groupID', api.deleteGroup)
    app.get(apiPath+'/groups/:groupID', api.getGroup)
    app.delete(apiPath+'/groups/:groupID/:movieID', api.removeMovieFromGroup)

    //IMDB calls
    app.get(apiPath+'/movies/top', api.getTopMovies), //optional query params -> top
    app.get(apiPath+'/movies/search', api.searchMovie) //necessary params -> searchTerms. Optional =skip and limit
    app.get(apiPath+'/movies/:movieID', api.getMovie)
    app.get(apiPath+'/actor/:actorID', api.getActor)

    //DOCS
    const swaggerDocument = yaml.load('../Docs/cmdb-api-spec.yaml')
    app.use(apiPath+'/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

    // WEB
    app.use('/', webSite(config))

    app.listen(PORT, () => console.log(`Server listening in http://localhost:${PORT}. dataSource -> ${config.isDataSourceElastic ? "elasticSearch" : "memory"}`))

    console.log("End setting up server")

    return app
}

export class ServerConfig {
    /**
     * @param {number} port 
     * @param {boolean} isDataSourceElastic 
     * @param {string} elasticSearchURL
     */
    constructor(port, isDataSourceElastic, elasticSearchURL){
        if(typeof port != "number" && port > 0) throw new Error("A valid port number must be provided")
        if(isDataSourceElastic) {
            if(typeof elasticSearchURL != "string") throw new Error(`If data source is elastic, a valid elasticSearchURL must be provided. Obtained: ${elasticSearchURL}`)
        }

        this.port = port
        this.isDataSourceElastic = isDataSourceElastic
        this.elasticSearchURL = elasticSearchURL
    }
}
