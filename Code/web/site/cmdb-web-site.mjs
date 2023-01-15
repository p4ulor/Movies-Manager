import express from 'express'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import * as server from '../../cmdb-server.mjs'
import * as services from '../../services/cmdb-services.mjs'
import { doesBodyContainProps, totalMinutesToHoursAndMinutes } from '../../utils/utils.mjs'
import * as body from '../../utils/req-resp-bodies.mjs'
import * as fs from 'node:fs'
import * as path from 'node:path'

const router = express.Router() //Let's us define a fragment of our express app that can be joined with other parts of our app https://expressjs.com/en/5x/api.html#router

function getHost() { //we do it like this because this script is ran beforethe cmdb-server.mjs, so the server.PORT would cause and undefined reference exception
    return `http://localhost:${server.PORT}`
}

class HandleBarsView {
    /**
     * @param {String} file 
     * @param {Object} options
     */
    constructor(file, title, script) {
        this.file = file
        this.options = {
            title: !title ? "CMDB" : title,
            host: getHost(),
            script: script
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
        view: "login.hbs",
        wrongPW: "/login?wrongPW=true",
        script: `${path.resolve("../Code/web/site/scripts/login.js").replace(/\\/g, '/')}` //https://stackoverflow.com/a/60395362/9375488
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
        view: "group.hbs",
        setUrl: (groupID) => { return `/groups/${groupID}` }
    },
    pageOfAMovie: {
        url: "/movies/:movieID",
        view: "movie.hbs",
        setUrl: (movieID) => { return `/movies/${movieID}` }
    },
    searchMovies: {
        url: "/search",
        view: "searchMovies.hbs"
    },
    topMovies: {
        url: "/top",
        view: "getTopMovies.hbs"
    },
    pageOfAnActor: {
        url: "/actor/:actorID",
        view: "actorBio.hbs",
        setUrl: (actorID) => { return `/actor/${actorID}` }
    },
    pageError: {
        url: "/error",
        view: "error.hbs",
        setUrl: (name) => { return `/error?type=${name}` }
    }
}

router.get(webPages.home.url, (req, rsp) => {
    tryCatch(() => {
        const view = new HandleBarsView(webPages.home.view, 'Home')
        rsp.render(view.file, view.options)
    }, rsp)
})

router.get(webPages.login.url, (req, rsp) => {
    tryCatch(() => {
        const view = new HandleBarsView(webPages.login.view, 'Login')
        if(req.query.wrongPW=="true") view.options.wrongPW = true
        view.options.loginRoute = shadowWebRoutes.login
        view.options.registerPage = webPages.register.url
        view.options.script = fs.readFileSync(webPages.login.script).toString()
        rsp.render(view.file, view.options)
    }, rsp)
})

router.get(webPages.register.url, (req, rsp) => {
    tryCatch(() => {
        const view = new HandleBarsView(webPages.register.view, 'Register')
        view.options.registerRoute = shadowWebRoutes.register
        rsp.render(view.file, view.options)
    }, rsp)
})

router.get(webPages.mygroups.url, (req, rsp) => {
    tryCatch(() => {
        const view = new HandleBarsView(webPages.mygroups.view, null)
        view.options.userName = getUserNameFromCookie(req)
        view.options.groups = []
        view.options.createGroupPage = webPages.createGroup.url
        const token = getTokenFromCookie(req, rsp)
        services.getGroupList(0, 10, token).then(arrayOfGroups => {
            arrayOfGroups.groups.forEach(group => {
                view.options.groups.push(
                    {
                        groupName: group.name,
                        groupPage: webPages.pageOfAGroup.setUrl(group.id)
                    }
                )
            })
            rsp.render(view.file, view.options)
        })
    }, rsp)
})

router.get(webPages.createGroup.url, (req, rsp) => {
    tryCatch(() => {
        const view = new HandleBarsView(webPages.createGroup.view, 'Search for a movie')
        view.options.createGroupRoute = shadowWebRoutes.newGroup
        rsp.render(view.file, view.options)
    }, rsp)
})

router.get(webPages.pageOfAGroup.url, (req, rsp) => {
    tryCatch(() => {
        const view = new HandleBarsView(webPages.pageOfAGroup.view)
        view.options.userName = getUserNameFromCookie(req)
        const token = getTokenFromCookie(req, rsp)
        services.getGroup(req.params.groupID, token).then(group => {
            view.options.groupID = group.id
            view.options.groupName = group.groupObj.name
            view.options.groupDescription = group.groupObj.description
            view.options.totalDuration = totalMinutesToHoursAndMinutes(group.groupObj.totalDuration)
            view.options.updateGroupRoute = shadowWebRoutes.updateGroup.setUrl(group.id)
            view.options.deleteGroupRoute = shadowWebRoutes.deleteGroup.setUrl(group.id)
            view.options.movies = group.groupObj.movies.map(movie => {
                return {
                    movieName: movie.name,
                    movieDuration: totalMinutesToHoursAndMinutes(movie.duration),
                    moviePage: webPages.pageOfAMovie.setUrl(movie.id),
                    removeMovieRoute: shadowWebRoutes.removeMovie.setUrl(movie.id),
                    groupID: group.id,
                    movieID: movie.id
                }
            })
            rsp.render(view.file, view.options)
        })
    }, rsp)
})

router.get(webPages.pageOfAMovie.url, (req, rsp) => {
    tryCatch(() => {
        const view = new HandleBarsView(webPages.pageOfAMovie.view)
        const token = getTokenFromCookie(req, rsp)
        services.getMovie(req.params.movieID, token).then(movie => {

            view.options.movieName = movie.movieObj.name
            view.options.movieDescription = movie.movieObj.description
            view.options.movieDuration = ` (${totalMinutesToHoursAndMinutes(movie.movieObj.duration)})`
            view.options.imageURL = movie.movieObj.imageURL
            view.options.movieDirectors = movie.movieObj.director
            view.options.movieActors = movie.movieObj.actors

            view.options.shadowWebPath = shadowWebPath
            view.options.movieID = req.params.movieID
            view.options.getListOfGroupsURI = server.apiRoutes.getGroups

            view.options.actorsList = movie.movieObj.actorsList.map(actor => {
                return {
                    actorName: actor.name,
                    actorPage: webPages.pageOfAnActor.setUrl(actor.id)
                }
            })
            
            rsp.render(view.file, view.options)
        })
    }, rsp)
})

router.get(webPages.searchMovies.url, (req, rsp) => {
    tryCatch(() => {
        const view = new HandleBarsView(webPages.searchMovies.view, 'Search for a movie')
        if(req.query.searchTerms!=undefined){
            view.options.searchTerms = req.query.searchTerms //causes the value in the input box to not disappear
            view.options.pageNumber = req.query.page==undefined ? 1 : new Number(req.query.page)+1
            const skip = new Number(view.options.pageNumber) * 5 - 5
            const token = getTokenFromCookie(req, rsp)
            services.searchMovie(req.query.searchTerms, skip, 5, token).then(result => {
                view.options.movies = result.found.map(movieResultItem => {
                    //console.log(movie)
                    return {
                        movieName: movieResultItem.title,
                        movieDescription: movieResultItem.description,
                        moviePage: webPages.pageOfAMovie.setUrl(movieResultItem.id)
                    }
                })
                rsp.render(view.file, view.options)
            })
        } else {
            view.options.nextLimit = 5
            rsp.render(view.file, view.options)
        }
    }, rsp)
})

router.get(webPages.topMovies.url, (req, rsp) => {
    tryCatch(() => {
        const view = new HandleBarsView(webPages.topMovies.view, 'Top movies')
        const limit = !req.query.top ? 5 : req.query.top
        const token = getTokenFromCookie(req, rsp)
        services.getTopMovies(limit, token).then(topMovies => {
            view.options.movies = topMovies.top.map(movie => {
                return {
                    movieName: movie.name,
                    movieDuration: "",
                    moviePage: webPages.pageOfAMovie.setUrl(movie.id)
                }
            })

            rsp.render(view.file, view.options)
        })
    }, rsp)
})

router.get(webPages.pageOfAnActor.url, (req, rsp) => {
    tryCatch(() => {
        const view = new HandleBarsView(webPages.pageOfAnActor.view)
        const token = getTokenFromCookie(req, rsp)
        services.getActor(req.params.actorID, token).then(actor => {
            view.options.actorName = actor.actorObj.name
            view.options.birthDate = actor.actorObj.birthDate
            view.options.imageURL = actor.actorObj.image
            rsp.render(view.file, view.options)
        })
    }, rsp)
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
        url: `${shadowWebPath}/groups/:groupID/:movieID`,
        setUrl: (groupID, movieID) => { return `${shadowWebPath}/groups/${groupID}/${movieID}` } 
    }
}

// Web-specific utility routes. 
//This is because, by default, when the form is submited, an HTTP request will be done for URI declared in the property 'action' in a <form>. When this is done, the page will be redirected to that path. At the first glance one might think that we want to call the API, but we shouldnt do that because the API doesn't return views or build views, nor it shouldn't redirect us to other places. The API should only return a json result.
router.post(shadowWebRoutes.login, (req, resp, next) => {
    tryCatch(() => {
        doesBodyContainProps(req.body, body.UserLoginRequest)
        services.userSignUpOrLogin(req.body, false)
        .then(tokenAnduserID => {
            processLoginOrRegister(req, resp, tokenAnduserID)
            req.login(tokenAnduserID.token) // #passport https://www.passportjs.org/concepts/authentication/login/ https://stackoverflow.com/a/54274283/9375488
        })
        .catch((e) => {
            redirect(resp, webPages.login.wrongPW)
        }) 
        //next() // what is this next 'next' function? -> https://stackoverflow.com/a/46122356/9375488
    }, resp)
})

router.post(shadowWebRoutes.register, (req, resp) => {
    tryCatch(() => {
        doesBodyContainProps(req.body, body.UserLoginRequest)
        services.userSignUpOrLogin(req.body, true)
        .then(tokenAnduserID => {
            processLoginOrRegister(req, resp, tokenAnduserID)
        })
    }, resp)
})

router.post(shadowWebRoutes.newGroup, (req, resp) => {
    tryCatch(() => {
        const token = getTokenFromCookie(req, resp)
        services.createGroup(req.body.name, req.body.description, false, token).then(isDone => {
            console.log(`User redirected. Is operation done? ${isDone}`)
            redirect(resp, webPages.mygroups.url)
        })
    }, resp)
})

router.post(shadowWebRoutes.deleteGroup.url, (req, resp, next) => {
    tryCatch(() => {
        const token = getTokenFromCookie(req, resp)
        services.deleteGroup(req.params.groupID, token).then(_ => {
            redirect(resp, webPages.mygroups.url)
        })
    }, resp)
})

router.post(shadowWebRoutes.removeMovie.url, (req, resp) => {
    tryCatch(() => {
        const token = getTokenFromCookie(req, resp)
        const groupID = req.body.groupID
        const movieID = req.body.movieID
        services.removeMovieFromGroup(groupID, movieID, token).then(_ => {
            redirect(resp, webPages.pageOfAGroup.setUrl(groupID))
        })
    }, resp)
})

router.post(shadowWebRoutes.updateGroup.url, (req, resp) => {
    tryCatch(() => {
        const token = getTokenFromCookie(req, resp)
        console.log(JSON.stringify(req.body))
        const groupID = req.params.groupID
        const newGroupName = req.body.groupName
        const newGroupDescription =  req.body.groupDescription
        services.updateGroup(groupID, newGroupName, newGroupDescription, token).then(_ => {
            redirect(resp, webPages.pageOfAGroup.setUrl(groupID))
        })
    }, resp)
})

router.post(shadowWebRoutes.addMovieToGroup.url, (req, resp) => {
    tryCatch(() => {
        const token = getTokenFromCookie(req, resp)
        console.log(JSON.stringify(req.body))
        const groupID = req.params.groupID
        const movieID = req.params.movieID
        services.addMovieToGroup(movieID, groupID, token).then(msg => {
            console.log(msg.msg)
            redirect(resp, webPages.pageOfAGroup.setUrl(groupID))
        })
    }, resp)
})

/**
 * @param {express.Response} rsp 
 * @param {string} msg 
 */
 router.get(webPages.pageError.url, function(req, rsp){
    const view = new HandleBarsView(webPages.pageError.view, null)
    if(req.query) view.options.msg = req.query.type
    else view.options.msg = "Internal Server Error"
    rsp.render(view.file, view.options)
})

router.get('*', function(req, rsp){
    tryCatch(() => {
        const view = new HandleBarsView('notFound.hbs', 'Not found')
        rsp.status(404).render(view.file, view.options);
    }, rsp)
})


/**
 * 
 * @param {Function} func 
 * @param {express.Response} rsp 
 */
async function tryCatch(func, rsp){ //this cuts down 3 lines per api/controller method
    if(typeof func !== 'function') throw new Error("Can't use this function like this. param 'func' must be a function")
    try {
        await func()
    } catch(e) {
        console.log(e)
        redirect(rsp, webPages.pageError.setUrl(e.name))
    }
}

/**
 * @param {express.Request} req 
 * @param {express.Response} resp 
 * @param {body.LoginResponse} tokenAnduserID 
 */
function processLoginOrRegister(req, resp, tokenAnduserID){
    let tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    resp.cookie("userName", req.body.name)
    resp.cookie('token', tokenAnduserID.token, { expires: tomorrow })
    redirect(resp, webPages.home.url)
}

/**
 * @param {express.Response} resp 
 * @param {string} url 
 */
function redirect(resp, url){
    resp.setHeader('Location', url) // OR -> resp.redirect(`/`)
        .status(302)
        .end()
}

function getUserNameFromCookie(req){
    return req.cookies.userName  //this is possible due to 'app.use(cookieParser())', otherwise it accessing .userName would cause undefined reference error
}

function getTokenFromCookie(req, resp){
    const token = req.cookies.token
    if(token==undefined) redirect(resp, webPages.login.url)
    else return token
}