'use strict' //lembrar q o prof disse q isto podia dar problemas em certos sitios nao era?

const crypto = await import('node:crypto') //https://nodejs.org/api/crypto.html#crypto
import * as imdbAPI from './imdb-movies-data.mjs'
import { BadRequest, Conflict, Forbidden, NotFound, ServerError } from '../utils/errors-and-codes.mjs';
import { User, UserObj, Group, GroupObj, Movie, MovieObj, Actor, ActorObj, assignGroup} from './cmdb-data-objs.mjs'
import * as elasticFetch from '../utils/elastic-fetch.mjs'
import * as bodies from '../utils/req-resp-bodies.mjs'

export const ourIndexes = {
    users: "users",
    groups: "groups",
    movies: "movies",
    actors: "actors"
}

export function createOurIndexes(){ 
    Object.values(ourIndexes).forEach(indexName => {
        elasticFetch.createIndex(indexName)
        console.log("created", indexName)
    })
}

export async function createUser(name, password, api_key){
    try {
        const saltAndHashedPW = hashPassword(password)
        const token = crypto.randomUUID()
        let newUser = new UserObj(name, [], token, saltAndHashedPW.hashedPassword, saltAndHashedPW.salt, api_key)
        console.log("New user -> ", newUser)

        return elasticFetch.create(ourIndexes.users, newUser).then(obj => {
            newUser.id = obj._id
            return new bodies.LoginResponse(newUser.token, newUser.id)
        })
    } catch(e) { throw e }
}
/**
 * @param {UserObj} userObj 
 * @param {string} passwordProvided 
 * @returns {Promise<false | {token: any; userID: any;}>}
 */
export async function loginUser(userObj, passwordProvided){
    try {
        if(verifyPassword(passwordProvided, userObj.hash, userObj.salt)) return new bodies.LoginResponse(userObj.token, userObj.id)
        return false
    } catch(e) { throw e }
}

/**
 * @param {string} userID 
 * @param {string} name 
 * @param {string} description 
 * @param {boolean} isPrivate 
 */
export async function createGroupForUser(userID, name, description, isPrivate){
    try {
        let user = await getUserByID(userID)

        let group = new GroupObj(name, description, true)

        elasticFetch.create(ourIndexes.groups, group).then(obj =>{
            user.userObj.groups.push(obj._id)
            elasticFetch.update(ourIndexes.users, user.id, user.userObj).then(obj =>{
            
            })   
        })
    } catch(e) { throw e }
}

export async function addMovieToGroupOfAUser(userID, movieID, groupID){
    try {
        const user = await getUserByID(userID)
        const movie = await getMovieFromDBorIMDB(movieID, user.userObj.api_key, false)
        elasticFetch.get(ourIndexes.groups, groupID).then(obj => {
            console.log(JSON.stringify(obj))
            if(obj.found==false) return null
            return obj._source
        }).then(group => {
            console.log("Group obtained", JSON.stringify(group))
            const theGroup = assignGroup(group) //just so we make use of the .addMovie() function
            theGroup.addMovie(movie.id, movie.duration)
            elasticFetch.update(ourIndexes.groups, groupID, theGroup).then(obj =>{
                
            })
        })
    } catch(e) { throw e }
}

export async function getGroupListOfAUser(skip, limit, userID){
    try {
        const user = await getUserByID(userID)
        const groupsFound = user.user.groups.slice(skip, skip+limit).map(group => {
            return elasticFetch.get(ourIndexes.groups, group.id).then(obj => {
                console.log(JSON.stringify(obj))
                if(obj.found==false) throw new NotFound(`The user w/ id=${userID} doesn't have a group whose id=${groupID}`)
                return obj._source
            }).then (grup => {
                return new bodies.GroupsItemListResponse(grup.id, grup.name)
            })
        })
        return new bodies.GroupsListResponse(groupsFound)
    } catch(e) { throw e }
}

export async function updateGroup(userID, groupID, name, description){
    try {
        elasticFetch.get(ourIndexes.groups, groupID).then(obj => {
            if(obj.found==false) throw new NotFound(`The user w/ id=${userID} doesn't have a group whose id=${groupID}`)
            const group = new Group(obj._id, obj._source)
            group.groupObj.name = name
            group.groupObj.description = description
            elasticFetch.update(ourIndexes.groups, groupID, group.groupObj).then(obj => {
                console.log(`updatedGroup ->`, JSON.stringify(obj))
            })
        })
    } catch(e) { throw e }
}

/**
 * @param {number} groupID
 * @param {number} userID
 */
export async function deleteGroup(groupID, userID){
    try {
        const user = await getUserByID(userID)
        let indice = 0

        if(!user.groups.some(id =>{ return id==groupID})) throw new NotFound(`The user w/ id=${userID} doesn't have a group whose id=${groupID}`)

        return elasticFetch.delite(ourIndexes.groups, groupID).then(obj =>{
            if (obj.result == "deleted"){
                user.groups.slice(indice, indice + 1)
                elasticFetch.update(ourIndexes.users, userID, user.user).then(obj =>{
                    console.log(`deleteGroup elastic response ->`, JSON.stringify(obj))
                    return new bodies.GeneralServerResponse(`Deleted group w/ id -> ${groupID} from user -> ${user.user.name}`)
                })
            }
            else throw new ServerError(`Deletion of group w/ id=${groupID} failed`)
        })   
    } catch(e) { throw e }
}

/**
 * @param {number} groupID
 * @returns {Promise<Group>}
 */
export async function getGroup(groupID){
    try {
        elasticFetch.get(ourIndexes.groups, groupID).then(obj => {
            console.log(JSON.stringify(obj))
            if(obj.found==false) return null
            return new Group(obj._id, obj._source)
        })
    } catch(e) { throw e }
}

/**
 * @type {msg: string} Message
 * @param {number} groupID 
 * @param {string} movieID 
 * @param {string} token 
 * @returns {Promise<Message>}
 */
export async function removeMovieFromGroup(groupID, movieID, userID){
    try {
        let group = await elasticFetch.get(ourIndexes.groups, groupID).then(obj => {
            console.log(JSON.stringify(obj))
            if(obj.found==false) throw new NotFound(`Group w/ ID=${groupID} not found`)
            return new Group(obj._id, obj._source)
        })
 
        let wasMovieRemovedSuccessful = group.group.removeMovie(movieID)

        if(wasMovieRemovedSuccessful) {
            return elasticFetch.create(ourIndexes.groups, group.group).then(obj =>{
                console.log("removeMovieFromGroup result -> ", JSON.stringify(obj))
                return new bodies.GeneralServerResponse(`Deleted movie w/ id -> ${movieID} from group -> ${group.group.name}`)
            })
        }
        else throw new NotFound(`Movie w/ id=${movieID} in group w/ id=${groupID} not found`)
    } catch(e) { throw e }
}

//Auxiliary functions for the password operations:
//https://blog.loginradius.com/engineering/password-hashing-with-nodejs/
function hashPassword(pw){ //https://nodejs.org/api/crypto.html#cryptopbkdf2syncpassword-salt-iterations-keylen-digest     
    const salt = crypto.randomBytes(16).toString('hex')
    const hashedPassword = crypto.pbkdf2Sync(pw, salt,  100, 32, `sha512`).toString(`hex`)
    return {salt, hashedPassword}
}

function verifyPassword(pw, hashedPassword, usersSalt){
    const hash = crypto.pbkdf2Sync(pw, usersSalt, 100, 32, `sha512`).toString(`hex`)
    return hashedPassword === hash
}

//Auxiliary functions for searching actors or movies in our DB (or IMDB if it doesn't exist)

/**
 * @param {string} token //used for services to know if a user exists
 * @param {string} name //used to check if there's already a user with a name of a user to be registered
 * @param {boolean} onlyCheckIfItExists 
 * @returns {Promise <User | boolean | undefined}
 */
export async function tryFindUserBy_(token, name, onlyCheckIfItExists){
    function userFound(){
        if(name) {
            console.log("Name " + name)
            return elasticFetch.search(ourIndexes.users, "name", name).then(obj => {
                console.log("Performed elastic search->",JSON.stringify(obj))
                if(obj.hits.hits.length==0) return null
                return new User(obj.hits.hits[0]._id , obj.hits.hits[0]._source)
            })
        }
        if(token) {
            console.log("Token " + token)
            return elasticFetch.search(ourIndexes.users, "token", token).then(obj => {
                console.log("Performed elastic search->",JSON.stringify(obj))
                if(obj.hits.hits.length==0) return null
                return new User(obj.hits.hits[0]._id , obj.hits.hits[0]._source)
            })
        }
        else return null
    }

    const user_Found = await userFound()
    if(onlyCheckIfItExists) return user_Found!=null
    return user_Found
}

/**
 * @param {number} id 
 * @param {string} token 
 * @param {string} name 
 * @param {boolean} onlyCheckIfItExists 
 * @return {Promise<User>}
 */
export async function getUserByID(id) {
    if(!id || id<1) throw new Error(`Invalid ID=${id}`)

    return elasticFetch.get(ourIndexes.users, id).then(obj => {
        console.log(JSON.stringify(obj))
        if(obj.found==false) throw new NotFound(`User with id=${id} not found`)
        return new User(obj._id , obj._source)
    })
}

/**
 * @param {string} movieID 
 * @returns {Promise<MovieObj | null>} A movie if found or null otherwise
 */
async function findMovieInServerDB(movieID){
    return await elasticFetch.get(ourIndexes.movies, movieID).then(obj => {
        if(obj.found==false) return null
        return new Movie(obj._id, obj._source) 
    })
}

/**
 * @param {string} movieID
 * @param {string} api_key
 * @param {boolean} justShowPreview If true shows id, name and description of movie, otherwise returns all info of Movie
 * @returns {Promise<MovieObj>} either gets the movie from our DB if exists or imdb if not
 */
export async function getMovieFromDBorIMDB(movieID, api_key, justShowPreview){
    console.log("Called getMovieFromDB_or_IMDB", `Preview: ${justShowPreview}`)
    if(typeof movieID!= 'string' || typeof api_key!= 'string') throw new BadRequest(`userAPIKey and movieID must be provided. userAPIKey=${api_key}. movieID=${movieID}`)
    let movie = await findMovieInServerDB(movieID)
    if(!movie){
        movie = await imdbAPI.imdb_getMovie(api_key, movieID)
        if(movie==null) throw new BadRequest(`Movie w/ ID=${movieID} doesn't exist`)

        //Add obtained movie to our DB
        elasticFetch.create(ourIndexes.movies, movie).then(obj => {
            console.log(`Inserted movie -> ${JSON.stringify(movie)} to our DB`)
        })
    } 
    else console.log("Obtained movie from our DB")

    if(justShowPreview) return movie.getPreview()
    else return movie
}

/**
 * @param {string} actorID 
 * @returns {Actor | null} A actor if found or null otherwise
 */
function findActorInServerDB(actorID){
    return elasticFetch.get(ourIndexes.actors, actorID).then(obj => {
        if(obj.found==false) return null
        console.log(`Actor obtained from our DB -> ${JSON.stringify(obj)}`)
        return new Actor(obj._id, obj._source) 
    })
}

export async function getActorFromDBorIMDB(actorID, api_key){
    console.log(`Called getActorFromDBorIMDB, actorID=${actorID}`)
    if(typeof actorID!= 'string' || typeof api_key!= 'string') throw new BadRequest(`userAPIKey and actorID must be provided. userAPIKey=${api_key}. actorID=${actorID}`)
    let actor = findActorInServerDB(actorID)
    if(!actor){
        actor = await imdbAPI.imdb_getActor(api_key, actorID)
        if(actor==null) throw new BadRequest(`Actor w ID=${actorID} doesn't exist`)

        //Add obtained actor to our DB
        elasticFetch.create(ourIndexes.actors, actor).then(obj => {
            console.log(`Inserted movie -> ${JSON.stringify(actor)} to our DB`)
        })
    } 
    else console.log("Obtained actor from our DB")
    return actor
}

/**
 * @param {string} method Must be "POST", "GET", etc
 * @param {Object} body 
 */
async function fetx(path, method, body){
    return fetch(baseURL + path, {
        method: method, 
        body : (body || method!="GET" || method!="DELETE") ? JSON.stringify(body) : null ,
        headers: { "Content-Type": "application/json" , "Accept" : "application/json"}
    }).then(rsp => {
        return rsp.json().then(obj => {
            console.log(`Fetch result -> ${JSON.stringify(obj)}`)
            return obj
        }).catch(e => {
            console.log("Error parsing to json -> "+e)
        })
    }).catch(e => {
        console.log("Request error -> "+e)
    })
}