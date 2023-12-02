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

//WEB
import webSite, { webPages } from './web/site/cmdb-web-site.mjs'

//DOCS
import swaggerUi from 'swagger-ui-express'
import yaml from 'yamljs'

/** 
 * @param {ServerConfig} config 
 * @returns {Promise<Express>}
 */
export function server(config){ //in order be to be used in tests and be more flexible

    if(!config instanceof ServerConfig) throw new Error("A ServerConfig must be provided")

    const PORT = config.port
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

    // Passport Initialization (not really used) https://www.npmjs.com/package/passport#:~:text=%7D)%3B-,Middleware,-To%20use%20Passport
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
    hbs.registerHelper('function_addMovieToGroupSetPath', function() { //https://handlebarsjs.com/guide/#custom-helpers Im oblitated to setup these helpers here or it doesnt work apparently... The helpers are useful to "import" function to allow us to reference functions in the .hbs files
        return theApi.apiPaths.addMovieToGroup.setPath
    })
    hbs.registerHelper('function_getPageOfAGroupSetPath', function() {
        return webPages.pageOfAGroup.setUrl
    })
    hbs.registerHelper('function_removeMovieFromGroup', function() {
        return theApi.apiPaths.removeMovieFromGroup.setPath
    })

    app.set('views', './web/site/views/') //https://expressjs.com/en/5x/api.html#app.settings.table:~:text=false%20(disabled)-,views,-String%20or%20Array

    app.use(favicon('./web/site/public/favicon.ico')) //https://expressjs.com/en/resources/middleware/serve-favicon.html
    app.use(express.static('./web/site/public')) //https://expressjs.com/en/starter/static-files.html
    app.use('/', authorizationMw) //this must be placed after the other "uses()" or things like req.cookie won't work

    app.use('/js', express.static(path.resolve("../Code/web/site/scripts/").replace(/\\/g, '/'))) //https://stackoverflow.com/a/55279238/9375488   https://stackoverflow.com/a/60395362/9375488 Allows the successful use of <script src="/js/client-fetch.js"></script> inside .hbs files

    //API
    const api = theApi.default(config)
    app.post(api.signUpUser.path, api.signUpUser.func)
    app.post(api.loginUser.path, api.loginUser.func)
    app.post(api.createGroup.path, api.createGroup.func)
    app.post(api.addMovieToGroup.path, api.addMovieToGroup.func)
    app.get(api.getGroupList.path, api.getGroupList.func) //query params -> skip and limit
    app.put(api.updateGroup.path, api.updateGroup.func)
    app.delete(api.deleteGroup.path, api.deleteGroup.func)
    app.get(api.getGroup.path, api.getGroup.func) //query params skip and limit
    app.delete(api.removeMovieFromGroup.path, api.removeMovieFromGroup.func)

    //IMDB calls
    app.get(api.getTopMovies.path, api.getTopMovies.func), //optional query params -> top
    app.get(api.searchMovie.path, api.searchMovie.func) //necessary params -> searchTerms. Optional =skip and limit
    app.get(api.getMovie.path, api.getMovie.func)
    app.get(api.getActor.path, api.getActor.func)

    //DOCS
    const swaggerDocument = yaml.load('../docs/cmdb-api-spec.yaml')
    app.use(theApi.docsPath, swaggerUi.serve, swaggerUi.setup(swaggerDocument))

    // WEB
    app.use('/', webSite(config))

    

    const promise = new Promise(async (resolve, reject) => {
        const server = app.listen(PORT, () => {
            console.log(`Server starting to listen in http://localhost:${PORT}. dataSource -> ${config.isDataSourceElastic ? "elasticSearch" : "memory"}`)
        })
        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                const errorMsg = `Port ${PORT} is already in use`
                reject(errorMsg)
            } else {
                console.error(`Other error occured ${err}`);
                reject(err)
            }
        });

        server.once('listening', () => {
            console.log("Listen successfull")
            resolve(app)
        });
    })

    console.log("End setting up server")

    return promise
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

        this.hostAndPort = `http://localhost:${this.port}`
    }
}
