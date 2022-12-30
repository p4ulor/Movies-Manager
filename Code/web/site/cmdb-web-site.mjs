import express from 'express'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import * as server from '../../cmdb-server.mjs'
import * as services from '../../services/cmdb-services.mjs'
import { doesBodyContainProps, totalMinutesToHoursAndMinutes } from '../../utils/utils.mjs'
import * as body from '../../utils/errors-and-bodies.mjs'
import fetch, { Response } from "node-fetch"
import * as hbs from 'hbs'

const router = express.Router() //Let's us define a fragment of our express app that can be joined with other parts of our app https://expressjs.com/en/5x/api.html#router

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
            /* path: shadowWebRoute */
            /* api: server.apiPath */
        }
    }
}

const webPages = {
    home: {
        url: "/",
        view: "home.hbs"
    },
    login: {
        url:"/login",
        view: "login.hbs"
    },
    register: {
        url:"/register",
        view: "register.hbs"
    },
    mygroups: {
        url:"/mygroups",
        view: "listOfGroups.hbs"
    },
    createGroup: {
        url:"/creategroup",
        view: "createGroup.hbs"
    },
    pageOfAGroup: {
        url: "/groups/:groupID",
        view: "group.hbs"
    },
    pageOfAMovie: {
        url: "/movies/:movieID",
        view: "movie.hbs"
    },
    searchMovies: {
        url: "/search",
        view: "searchMovies.hbs"
    },
    topMovies: {
        url: "/top",
        view: "getTopMovies.hbs"
    }
}

router.get(webPages.home.url, (req, rsp) => {
    const view = new HandleBarsView(webPages.home.view, 'Home')
    rsp.render(view.file, view.options)
})

router.get(webPages.login.url, (req, rsp) => {
    const view = new HandleBarsView(webPages.login.view, 'Login')
    view.options.loginRoute = shadowWebRoutes.login
    view.options.registerPage = webPages.register.url
    rsp.render(view.file, view.options)
})

router.get(webPages.register.url, (req, rsp) => {
    const view = new HandleBarsView(webPages.register.view, 'Register')
    view.options.registerRoute = shadowWebRoutes.register
    rsp.render(view.file, view.options)
})

router.get(webPages.mygroups.url, (req, rsp) => {
    const view = new HandleBarsView(webPages.mygroups.view, null)
    view.options.userName = getUserNameFromCookie(req)
    view.options.groups = []
    view.options.createGroupPage = webPages.createGroup.url
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

router.get(webPages.createGroup.url, (req, rsp) => {
    const view = new HandleBarsView(webPages.createGroup.view, 'Search for a movie')
    view.options.createGroupRoute = shadowWebRoutes.newGroup
    rsp.render(view.file, view.options)
})

router.get(webPages.pageOfAGroup.url, (req, rsp) => {
    const view = new HandleBarsView(webPages.pageOfAGroup.view)
    view.options.userName = getUserNameFromCookie(req)
    const token = getTokenFromCookie(req, rsp)
    services.getGroup(req.params.groupID, token).then(group => {
        view.options.groupID = group.id
        view.options.groupName = group.name
        view.options.groupDescription = group.description
        view.options.totalDuration = totalMinutesToHoursAndMinutes(group.totalDuration)
        view.options.updateGroupRoute = shadowWebRoutes.updateGroup.setUrl(group.id)
        view.options.deleteGroupRoute = shadowWebRoutes.deleteGroup.setUrl(group.id)
        view.options.movies = group.movies.map(movie => {
            return {
                movieName: movie.name,
                movieDuration: totalMinutesToHoursAndMinutes(movie.duration),
                moviePage: `/movies/${movie.id}`,
                removeMovieRoute: shadowWebRoutes.removeMovie.setUrl(movie.id),
                groupID: group.id,
                movieID: movie.id
            }
        })
        rsp.render(view.file, view.options)
    }).catch(e => {
        console.log(e)
        return null
    })
})

router.get(webPages.pageOfAMovie.url, (req, rsp) => {
    
    const view = new HandleBarsView(webPages.pageOfAMovie.view)
    const token = getTokenFromCookie(req, rsp)
    services.getMovie(req.params.movieID, token).then(movie => {
        view.options.movieName = movie.name
        view.options.movieDuration = ` (${totalMinutesToHoursAndMinutes(movie.duration)})`
        view.options.imageURL = movie.imageURL

        view.options.getListOfGroupsURI = server.apiRoutes.getGroups
        
        rsp.render(view.file, view.options)
    }).catch(e => {
        console.log(e)
        return null
    })
})

router.get(webPages.searchMovies.url, (req, rsp) => {
    const view = new HandleBarsView(webPages.searchMovies.view, 'Search for a movie')
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

router.get(webPages.topMovies.url, (req, rsp) => {
    const view = new HandleBarsView(webPages.topMovies.view, 'Top movies')
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

const shadowWebPath = "/web"

export const shadowWebRoutes = {
    login: `${shadowWebPath}/login`,
    register: `${shadowWebPath}/register`,
    newGroup: `${shadowWebPath}/newgroup`,
    deleteGroup: {
        url: `${shadowWebPath}/groups/delete/:groupID`,
        setUrl: (groupID) => { return `${shadowWebPath}/groups/delete/${groupID}` } 
    },
    removeMovie: {
        url: `${shadowWebPath}/groups/delete/movie/:groupID`,
        setUrl: (movieID) => { return `${shadowWebPath}/groups/delete/movie/${movieID}` } 
    },
    updateGroup: {
        url: `${shadowWebPath}/groups/update/:groupID`,
        setUrl: (groupID) => { return `${shadowWebPath}/groups/update/${groupID}` } 
    },
    addMovieToGroup: {
        url: `${shadowWebPath}/groups/update/:groupID/:movieID`,
        setUrl: (groupID, movieID) => { return `${shadowWebPath}/groups/${groupID}/${movieID}` } 
    }
}

// Web-specific utility routes. 
//This is because, by default, when the form is submited, an HTTP request will be done for URI declared in the property 'action' in a <form>. When this is done, the page will be redirected to that path. At the first glance one might think that we want to call the API, but we shouldnt do that because the API doesn't return views or build views, nor it shouldn't redirect us to other places. The API should only return a json result.
router.post(shadowWebRoutes.login, (req, resp, next) => {
    doesBodyContainProps(req.body, body.UserLoginRequest)

    services.userSignInOrLogin(req.body, false)
    .then(tokenAnduserID => {
        processLoginOrRegister(req, resp, tokenAnduserID)
    })
    .catch(next) // what is this next 'next' function? -> https://stackoverflow.com/a/46122356/9375488
})

router.post(shadowWebRoutes.register, (req, resp, next) => {
    doesBodyContainProps(req.body, body.UserLoginRequest)

    services.userSignInOrLogin(req.body, true)
    .then(tokenAnduserID => {
        processLoginOrRegister(req, resp, tokenAnduserID)
    })
    .catch(next)
})

router.post(shadowWebRoutes.newGroup, (req, resp, next) => {
    const token = getTokenFromCookie(req, resp)
    services.createGroup(req.body.name, req.body.description, false, token).then(groupID => {
        resp.setHeader('Location', `/mygroups`)
        .status(302)
        .end()
    })
    .catch(next)
})

router.post(shadowWebRoutes.deleteGroup.url, (req, resp, next) => {
    const token = getTokenFromCookie(req, resp)
    
    services.deleteGroup(req.params.groupID, token).then(_ => {
        resp.setHeader('Location', `/mygroups`)
        .status(302)
        .end()
    }).catch(next)
})

router.post(shadowWebRoutes.removeMovie.url, (req, resp, next) => {
    const token = getTokenFromCookie(req, resp)
    const groupID = req.body.groupID
    const movieID = req.body.movieID
    services.removeMovieFromGroup(groupID, movieID, token).then(_ => {
        resp.setHeader('Location', `/groups/${groupID}`)
        .status(302)
        .end()
    }).catch(next)
})

router.post(shadowWebRoutes.updateGroup.url, (req, resp, next) => {
    const token = getTokenFromCookie(req, resp)
    console.log(JSON.stringify(req.body))
    const groupID = req.params.groupID
    const newGroupName = req.body.groupName
    const newGroupDescription =  req.body.groupDescription
    services.updateGroup(groupID, newGroupName, newGroupDescription, token).then(_ => {
        resp.setHeader('Location', `/groups/${groupID}`)
        .status(302)
        .end()
    }).catch(next)
})

router.post(shadowWebRoutes.addMovieToGroup.url, (req, resp, next) => {
    const token = getTokenFromCookie(req, resp)
    console.log(JSON.stringify(req.body))
    const groupID = req.params.groupID
    const movieID = 
    services.addMovieToGroup(movieID, groupID, token).then(msg => {
        console.log(msg.msg)
        resp.setHeader('Location', `/groups/${groupID}`)
        .status(302)
        .end()
    }).catch(next)
})

router.get('*', function(req, res){
    const view = new HandleBarsView('notFound.hbs', 'Not found')
    res.status(404).render(view.file, view.options);
})


function processLoginOrRegister(req, resp, tokenAnduserID){
    let tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    resp.cookie("userName", req.body.name)
    resp.cookie('token', tokenAnduserID.token, { expires: tomorrow })
    resp.cookie('userID', tokenAnduserID.userID, { expires: tomorrow }) //actually I dont remember why I return and store the id
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