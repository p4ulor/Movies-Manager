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

    services.getGroupList(0, 2, getTokenFromCookie(req)).then(arrayOfGroups => {
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
    services.getGroup(req.params.groupID, getTokenFromCookie(req)).then(group => {
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
    services.getMovie(req.params.movieID, getTokenFromCookie(req)).then(movie => {
        view.options.movieName = movie.name
        view.options.movieDuration = totalMinutesToHoursAndMinutes(movie.duration)
        view.options.imageURL = movie.imageURL
        rsp.render(view.file, view.options)
    }).catch(e => {
        console.log(e)
        return null
    })
})

router.get('/search',(req, rsp) => {
    const view = new HandleBarsView('searchMovies.hbs', 'Search for a movie')
    rsp.render(view.file, view.options)
})

router.get('/top',(req, rsp) => {
    const view = new HandleBarsView('getTopMovies.hbs', 'Top movies')
    rsp.render(view.file, view.options)
})

router.get('*', function(req, res){
    const view = new HandleBarsView('notFound.hbs', 'Not found')
    res.status(404).render(view.file, view.options);
});

export default router

// Web-specific utility routes. 
//This is because, by default, when the form is submited, an HTTP request will be done for URI declared in the property 'action' in a <form>. When this is done, the page will be redirected to that path. At the first glance one might think that we want to call the API, but we shouldnt do that because the API doesn't return views or build views, nor it shouldn't redirect us to other places. The API should only return a json result.
router.post(`${shadowWebRoute}/login`, (req, resp, next) => {
    doesBodyContainProps(req.body, body.UserLoginRequest)

    services.userSignInOrLogin(req.body, false)
    .then(tokenAnduserID => {
        processLoginOrRegister(req, resp, tokenAnduserID)
    })
    .catch(next) //https://stackoverflow.com/a/46122356/9375488
})

router.post(`${shadowWebRoute}/register`, (req, resp, next) => {
    doesBodyContainProps(req.body, body.UserLoginRequest)

    services.userSignInOrLogin(req.body, true)
    .then(tokenAnduserID => {
        processLoginOrRegister(req, resp, tokenAnduserID)
    })
    .catch(next) //https://stackoverflow.com/a/46122356/9375488
})

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

function getTokenFromCookie(req){
    return req.cookies.token
}