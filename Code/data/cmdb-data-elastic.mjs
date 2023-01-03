'use strict'

import * as imdbAPI from './imdb-movies-data.mjs'
import fetch from "node-fetch"
import { BadRequest, Conflict, Forbidden, NotFound } from '../utils/errors-and-bodies.mjs';
import { User, ElasticUser, Group, Movie, Actor} from './cmdb-data-objs.mjs'

const crypto = await import('node:crypto')
const baseURL= "http://localhost:9200/"
const insert = "_doc?refresh=wait_for"
const obtain = (elasticSearch) => { return `_doc/${elasticSearch}` } 
const updateBody = (obj) => { return {doc: obj}}

// TODO: think about this
let userIDCount = 0
let groupIDCount = 0

function nextUserID (){
    return 0
}
function nextGroupID (){
    return 0
}

export async function createUser(name, password, api_key){
    try {
        if(await tryFindUserBy_(false, false, name, true)) throw new Conflict(`There's already a user with name=${name}`)
        const saltAndHashedPW = hashPassword(password)
        const token = crypto.randomUUID()
        const newUserIDvalue = nextUserID()
        const newUser = new User(newUserIDvalue , name, [], token, saltAndHashedPW.hashedPassword, saltAndHashedPW.salt, api_key)
        console.log("New user -> ", newUser)
        
        return fetx(`users/${insert}`, "POST", newUser).then(obj => {
            return {token: newUser.token, userID: newUser.id}
        })

    } catch(e) { throw e }
}

export async function loginUser(name, password){
    try {
        const userFound = (await tryFindUserBy_(false, false, name, false)).user
        if(verifyPassword(password, userFound.hash, userFound.salt)) return {token: userFound.token, userID: userFound.id}
        return false
    } catch(e) { throw e }
}

/**
 * 
 * @param {*} userID 
 * @param {*} name 
 * @param {*} description 
 * @param {*} isPrivate 
 * @returns 
 */
export async function createGroupForUser(userID, name, description, isPrivate){
    try {
        const elasticUser = (await tryFindUserBy_(userID, null, null, false))
        const userGroups = elasticUser.user.groups

        const group = new Group(null, name, description)
        return fetx(`groups/${insert}`, "POST", group).then(obj => {
            console.log("Object inserted -> " + JSON.stringify(obj))
            userGroups.push(obj._id)
        }).then( userGroup => {
            console.log("Inserted group -> " + JSON.stringify(userGroup))
            console.log("User to be updated -> " + JSON.stringify(elasticUser.user))
            const UserTBI = elasticUser.user
            return fetx(`users/_update/${elasticUser.elasticID}`, "POST", updateBody(UserTBI))
                .then(obj =>{
                    return obj._id
                })   
        })
    } catch(e) { throw e }
}

export async function addMovieToGroupOfAUser(userID, movieID, groupID){
    try {

        const elasticUser = (await tryFindUserBy_(userID, null, null, false))
        if (elasticUser.user.groups.find(groupID)){
            return fetx(`groups/_doc/${groupID}`, "GET").then(obj => {
                console.log(JSON.stringify(obj))
                if(obj.hits.hits.length==0) return null
                return obj.hits.hits[0]._source
            }).then(group => {
                group.movies.push(movieID)
                return fetx(`groups/_update/${groupID}`, "POST", updateBody(group))
                .then(obj =>{
                    return obj._id
                })
            })
        } else return console.error("Group not Found for User");
    } catch(e) { throw e }
}

export async function getGroupListOfAUser(skip, limit, userID){
    try {
        const elasticUser = (await tryFindUserBy_(userID, null, null, false))

        //const user = (await tryFindUserBy_(userID, null, null, false)).user
        const groupsFound = elasticUser.user.groups.slice(skip, skip+limit).map(group => { 
            return fetx(`groups/_doc/${group}`, "GET").then(obj => {
                console.log(JSON.stringify(obj))
                if(obj.found==false) return null
                return obj._source
            }).then (allgroup => {
                return {id: group, name: allgroup.name}
            })
        })
        return await groupsFound
    } catch(e) { throw e }
}

export async function updateGroup(userID, groupID, name, description){
    try {

        return fetx(`groups/_doc/${groupID}`, "GET").then(obj => {
            console.log(JSON.stringify(obj))
            if(obj.found==false) return null
            return obj._source
        }).then(group =>{
            group.name = name
            group.description = description
            return group
        }).then(newGroup =>{
            return fetx(`users/_update/${groupID}`, "POST", updateBody(newGroup))
                .then(obj =>{
                    return obj._id
                })   
        })
        return {id: groupID, name: newGroup.name, description: newGroup.description}
    } catch(e) { throw e }
}

/**
 * @type {msg: string}
 * @param {number} groupID
 * @param {number} userID
 * @returns {Promise<Message>}
 */
export async function deleteGroup(groupID, userID){
    try {
        const elasticUser = (await tryFindUserBy_(userID, null, null, false))
        let indice = 0
        elasticUser.user.groups.forEach(group =>{
            ++indice
            if (group == groupID){
                return fetx(`groups/_doc/${group}`, "DELETE", )
                .then(obj =>{
                    return obj.result
                }).then (result =>{
                    if (result == "deleted"){
                        elasticUser.user.groups.slice(indice,indice+1)
                        return fetx(`users/_update/${elasticUser.elasticID}`, "POST", updateBody(elasticUser.user))
                            .then(obj =>{
                            return obj._id
                            })
                    }
                })   
            }
        })
        return {msg: `Deleted group -> ${groupID}`}
    } catch(e) { throw e }
}

/**
 * @param {number} groupID
 * @param {number} userID
 * @returns {Promise<Group>}
 */
export async function getGroup(groupID, userID){
    try {
        let group = fetx( `groups/_doc/${groupID}`, "GET").then(obj => {
            console.log(JSON.stringify(obj))
            if(obj.found==false) return null
            return (obj._id, obj._source).Group
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
export async function removeMovieFromGroup(groupID, movieID, token){
    try {
        let group2 = fetx( `groups/_doc/${groupID}`, "GET").then(obj => {
            console.log(JSON.stringify(obj))
            if(obj.found==false) return null
            return (obj._id, obj._source).Group
        })

        
        const elasticUser = (await tryFindUserBy_(userID, null, null, false))
        let indice = 0
        elasticUser.user.groups.forEach(group =>{
            ++indice
            if (group == groupID){
                return fetx(`groups/_doc/${group}`, "DELETE", )
                .then(obj =>{
                    return obj.result
                }).then (result =>{
                    if (result == "deleted"){
                        elasticUser.user.groups.slice(indice,indice+1)
                        return fetx(`users/_update/${elasticUser.elasticID}`, "POST", updateBody(elasticUser.user))
                            .then(obj =>{
                            return obj._id
                            })
                    }
                })   
            }
        })





        const user = await tryFindUserBy_(null, token, null, false)
        const groupIndex = getIndexOfAGroupOfAUserById(user.groups, groupID)
        const group = user.groups[groupIndex]
        const movieIndex = getIndexOfAMovieOfAGroup(group, movieID)
        const movieToRemove = await getMovieFromDBorIMDB(movieID, user.token)

        group.movies.splice(movieIndex, 1)
        group.totalDuration -= movieToRemove.duration
        return {msg: `Deleted movie -> ${movieToRemove.name} from group -> ${group.name}`}
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

//Auxiliary function for querying. When used for createUser, onlyCheckIfItExists=true. Just to say if a user w/ same name exists
//For all the other uses, a call to this function is intended to return the user
/**
 * @param {number} id 
 * @param {string} token 
 * @param {string} name 
 * @param {boolean} onlyCheckIfItExists 
 * @return {Promise<ElasticUser | boolean>}
 */
export async function tryFindUserBy_(id, token, name, onlyCheckIfItExists) {
    let search = ""
    if(id || id===0) search = "id"
    if(name) search = "name"
    if(token) search = "token"
 
    function userFound(){ 
        if(id || id===0 ) {
            console.log("Doc_ID " + id)
            return fetx( `users/_doc/${id}`, "GET").then(obj => {
                console.log(JSON.stringify(obj))
                if(obj.found==false) return null
                return new ElasticUser(obj._id, obj._source)
            })
        }
        if(name) {
            console.log("Name " + name)
            return fetx(`users/_search?q=name:${name}`, "GET").then(obj => {
                console.log(JSON.stringify(obj))
                if(obj.hits.hits.length==0) return null
                return new ElasticUser(obj.hits.hits[0]._id, obj.hits.hits[0]._source)
            })
        }
        if(token) {
            console.log("Token " + token)
            return fetx(`users/_search?q=token:${token}`, "GET").then(obj => {
                console.log(JSON.stringify(obj))
                if(obj.hits.hits.length==0) return null
                return new ElasticUser(obj.hits.hits[0]._id, obj.hits.hits[0]._source)
            })
        }
        else return null
    }

    const user_Found = await userFound()

    if(onlyCheckIfItExists) return user_Found!=null
    if(!user_Found) throw new NotFound("User not found")
    return user_Found
}

function getIndexOfAGroupOfAUserById(groupsOfTheUser, groupID){ //DONT DELETE YET. AUXILIARY FUNCTION
    let index = -1
    const groupFound = groupsOfTheUser.find(group => {
        index++
        return group.id==groupID
    })

    if(!groupFound) throw new BadRequest(`Group with id ${groupID} not found`)
    return index
}

function getIndexOfAMovieOfAGroup(group, movieID) {  //DONT DELETE YET. AUXILIARY FUNCTION
    let index = -1
    const movieFound = group.movies.find(movieID => {
        index++
        return movieID==movieID
    })

    if(!movieFound) throw new BadRequest(`Movie with id ${movieID} not found`)
    return index
}

/**
 * @param {string} movieID 
 * @returns {Movie | undefined} A movie if found or undefined otherwise
 */
async function findMovieInServerDB(movieID){
    return await fetx(`movies/_search?q=id:${id}`, "GET").then(movie => {
        console.log(`Found movie in server DB -> ${JSON.stringify(movie)}`)
        return movie.hits.hits[0]._source
    }).catch(e => {
        return undefined
    })
}

/**
 * @param {string} movieID
 * @param {string} api_key
 * @param {boolean} justShowPreview If true shows id, name and description of movie, otherwise returns all info of Movie
 * @returns {Promise<Movie>} either gets the movie from our DB if exists or imdb if not
 */
export async function getMovieFromDBorIMDB(movieID, api_key, justShowPreview){
    console.log("Called getMovieFromDB_or_IMDB", `Preview: ${justShowPreview}`)
    if(typeof movieID!= 'string' || typeof api_key!= 'string') throw new BadRequest(`userAPIKey and movieID must be provided. userAPIKey=${api_key}. movieID=${movieID}`)
    let movie = findMovieInServerDB(movieID)
    if(movie==undefined){
        movie = await imdbAPI.imdb_getMovie(api_key, movieID)
        if(movie==null) throw new BadRequest(`Movie w ID doesn't exist`)

        fetx(`movies/${insert}`, "POST", movie).then(obj => {
            console.log(`Inserted movie -> ${JSON.stringify(movie)} to our DB`)
        })

    } else console.log("Obtained movie from our DB")
    if(justShowPreview) return movie.getPreview()
    else return movie
}

/**
 * @param {string} actorID 
 * @returns {Actor | undefined} A actor if found or undefined otherwise
 */
function findActorInServerDB(actorID){
    return fetx(`users/_search?q=id:${actorID}`, "GET").then(actor => {
        console.log(`Actor obtained from our DB -> ${JSON.stringify(actor)}`)
        return actor.hits.hits[0]._source
    })
}

export async function getActorFromDBorIMDB(actorID, api_key){
    console.log(`Called getActorFromDBorIMDB, actorID=${actorID}`)
    if(typeof actorID!= 'string' || typeof api_key!= 'string') throw new BadRequest(`userAPIKey and actorID must be provided. userAPIKey=${api_key}. actorID=${actorID}`)
    let actor = findActorInServerDB(actorID)
    if(actor==undefined){
        actor = await imdbAPI.imdb_getActor(api_key, actorID)
        if(actor==null) throw new BadRequest(`Actor w ID=${actorID} doesn't exist`)

        fetx(`actors/${insert}`, "POST", actor).then(obj => {
            console.log(obj)
        })

    } else console.log("Obtained actor from our DB")
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