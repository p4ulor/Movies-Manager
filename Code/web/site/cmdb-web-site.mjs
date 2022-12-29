import express from 'express'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import * as server from '../../cmdb-server.mjs'
import * as services from '../../services/cmdb-services.mjs'
import { doesBodyContainProps, totalMinutesToHoursAndMinutes } from '../../utils/utils.mjs'
import * as body from '../../utils/errors-and-bodies.mjs'
import fetch, { Response } from "node-fetch"

const router = express.Router() //Let's us define a fragment of our express app that can be joined with other parts of our app https://expressjs.com/en/5x/api.html#router

const shadowWebRoute = "/web"

function getHost() { //we do it like this because this script is ran beforethe cmdb-server.mjs, so the server.PORT would cause and undefined reference exception
    return `http://localhost:${server.PORT}`
}

class HandleBarsView {
    /**
     * @param {String} file 
     * @param {Object} options
     */
    constructor(file, title, host, path) {
        this.file = file
        this.options = {
            title: !title ? "CMDB" : title,
            host: getHost(),
            path: shadowWebRoute
            /* api: server.apiPath */
        }
    }
}

router.get('/',(req, rsp) => {
    const view = new HandleBarsView('home.hbs', 'Home')
    rsp.render(view.file, view.options)
})

router.get('/login',(req, rsp) => {
    const view = new HandleBarsView('login.hbs', 'Login')
    rsp.render(view.file, view.options)
})

router.get('/register',(req, rsp) => {
    const view = new HandleBarsView('register.hbs', 'Register')
    rsp.render(view.file, view.options)
})

router.get('/mygroups',(req, rsp) => {
    const view = new HandleBarsView('listOfGroups.hbs', null)
    view.options.userName = getUserNameFromCookie(req)
    view.options.groups = []
    const token = getTokenFromCookie(req, rsp)
    services.getGroupList(0, 3, token).then(arrayOfGroups => {
        arrayOfGroups.forEach(group => {
            view.options.groups.push(
                {
                    groupName: group.name,
                    groupPage: `/groups/${group.id}`
                }
            )
        })
        rsp.render(view.file, view.options)
    }).catch(e => {
        console.log(e)
        return null
    })
})

router.get('/groups/:groupID',(req, rsp) => {
    const view = new HandleBarsView('group.hbs', null)
    view.options.userName = getUserNameFromCookie(req)
    const token = getTokenFromCookie(req, rsp)
    services.getGroup(req.params.groupID, token).then(group => {
        view.options.groupName = group.name
        view.options.groupDescription = group.description
        view.options.totalDuration = group.totalDuration
        view.options.movies = group.movies.map(movie => {
            return {
                movieName: movie.name,
                movieDuration: totalMinutesToHoursAndMinutes(movie.duration),
                moviePage: `/movies/${movie.id}`
            }
        })
        rsp.render(view.file, view.options)
    }).catch(e => {
        console.log(e)
        return null
    })
})

router.get('/movies/:movieID',(req, rsp) => {
    const view = new HandleBarsView('movie.hbs')
    const token = getTokenFromCookie(req, rsp)
    services.getMovie(req.params.movieID, token).then(movie => {
        view.options.movieName = movie.name
        view.options.movieDuration = ` (${totalMinutesToHoursAndMinutes(movie.duration)})`
        view.options.imageURL = movie.imageURL
        rsp.render(view.file, view.options)
    }).catch(e => {
        console.log(e)
        return null
    })
})

router.get('/creategroup',(req, rsp) => {
    const view = new HandleBarsView('createGroup.hbs', 'Search for a movie')
    rsp.render(view.file, view.options)
})

router.get('/search',(req, rsp) => {
    const view = new HandleBarsView('searchMovies.hbs', 'Search for a movie')
    if(req.query.searchTerms!=undefined){
        view.options.searchTerms = req.query.searchTerms //causes the value in the input box to not disappear
        view.options.pageNumber = req.query.page==undefined ? 1 : new Number(req.query.page)+1
        const skip = new Number(view.options.pageNumber) * 5 - 5
        const token = getTokenFromCookie(req, rsp)
        services.searchMovie(req.query.searchTerms, skip, 5, token).then(result => {
            view.options.movies = result.found.map(movie => {
                //console.log(movie)
                return {
                    movieName: movie.title,
                    movieDescription: movie.description,
                    moviePage: `/movies/${movie.id}`
                }
            })
            rsp.render(view.file, view.options)
        })
    } else {
        view.options.nextLimit = 5
        rsp.render(view.file, view.options)
    }
})

router.get('/top',(req, rsp) => {
    const view = new HandleBarsView('getTopMovies.hbs', 'Top movies')
    const limit = !req.query.top ? 5 : req.query.top
    const token = getTokenFromCookie(req, rsp)
    services.getTopMovies(limit, token).then(topMovies => {
        view.options.movies = topMovies.top.map(movie => {
            return {
                movieName: movie.name,
                movieDuration: "",
                moviePage: `/movies/${movie.id}`
            }
        })

        rsp.render(view.file, view.options)
    })
    //rsp.render(view.file, view.options)
})

export default router

// Web-specific utility routes. 
//This is because, by default, when the form is submited, an HTTP request will be done for URI declared in the property 'action' in a <form>. When this is done, the page will be redirected to that path. At the first glance one might think that we want to call the API, but we shouldnt do that because the API doesn't return views or build views, nor it shouldn't redirect us to other places. The API should only return a json result.
router.post(`${shadowWebRoute}/login`, (req, resp, next) => {
    doesBodyContainProps(req.body, body.UserLoginRequest)

    services.userSignInOrLogin(req.body, false)
    .then(tokenAnduserID => {
        processLoginOrRegister(req, resp, tokenAnduserID)
    })
    .catch(next) // what is this next 'next' function? -> https://stackoverflow.com/a/46122356/9375488
})

router.post(`${shadowWebRoute}/register`, (req, resp, next) => {
    doesBodyContainProps(req.body, body.UserLoginRequest)

    services.userSignInOrLogin(req.body, true)
    .then(tokenAnduserID => {
        processLoginOrRegister(req, resp, tokenAnduserID)
    })
    .catch(next)
})

router.post(`${shadowWebRoute}/newgroup`, (req, resp, next) => {
    const token = getTokenFromCookie(req, resp)
    services.createGroup(req.body.name, req.body.description, false, token).then(groupID => {
        resp.setHeader('Location', `/mygroups`)
        .status(302)
        .end()
    })
    .catch(next)
})

router.get('*', function(req, res){
    const view = new HandleBarsView('notFound.hbs', 'Not found')
    res.status(404).render(view.file, view.options);
});


function processLoginOrRegister(req, resp, tokenAnduserID){
    let tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    resp.cookie("userName", req.body.name)
    resp.cookie('token', tokenAnduserID.token, { expires: tomorrow })
    resp.cookie('userID', tokenAnduserID.userID, { expires: tomorrow })
    resp.setHeader('Location', `/`) // OR -> resp.redirect(`/`)
        .status(302)
        .end()
}

function getUserNameFromCookie(req){
    return req.cookies.userName  //this is possible due to 'app.use(cookieParser())', otherwise it accessing .userName would cause undefined reference error
}

function getTokenFromCookie(req, resp){
    const token = req.cookies.token
    if(token==undefined) resp.setHeader('Location', `/login`).status(302).end()
    else return token
}