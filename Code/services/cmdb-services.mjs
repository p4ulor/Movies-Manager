//import { isDataSourceElastic } from '../cmdb-server.mjs'
//import * as data from `${isDataSourceElastic ? '../data/cmdb-data-elastic.mjs' : '../data/cmdb-data-mem.mjs'}`

let data = await import('../data/cmdb-data-mem.mjs') //We're performing initialization just to have intellisense during development
import('../cmdb-server.mjs').then(async servermjsLoaded =>{ //😈 this prevents "trying to access isDataSourceElastic before initialization"
    if(servermjsLoaded.isDataSourceElastic) data = await import('../data/cmdb-data-elastic.mjs')
    else data = await import('../data/cmdb-data-mem.mjs')
})

import * as imdbAPI from '../data/imdb-movies-data.mjs'
import * as error from '../utils/errors-and-codes.mjs'
import * as bodies from '../utils/req-resp-bodies.mjs'
import * as utils from '../utils/utils.mjs'
import { User, UserObj, Group, GroupObj, Movie, MovieObj, Actor, ActorObj} from '../data/cmdb-data-objs.mjs'

export async function userSignUpOrLogin(body, isSignUp) {
    try { 
        if(!isAStringAndNotEmpty(body.name)) throw new error.BadRequest("User name must be a non-empty string")
        const foundUser = await data.tryFindUserBy_(false, body.name)
        if(isSignUp) {
            if(foundUser) throw new error.Conflict(`There's already a user with name=${body.name}`)
            let res = await (data.createUser(body.name, body.password, body.api_key))
            return new bodies.LoginResponse(res.token, res.id)
        }
        else {
            if(!foundUser) throw new error.NotFound("User not found")
            const isPWCorrect = utils.verifyPassword(body.password, foundUser.userObj.hash, foundUser.userObj.salt)
            console.log("isPWCorrect ->"+JSON.stringify(isPWCorrect), `token=${foundUser.userObj.token}`)
            if(isPWCorrect==false) throw new error.Unauthorized("Wrong password")
            else return new bodies.LoginResponse(foundUser.userObj.token, foundUser.id)
        }
    } catch(e) { throw e }
}

export async function createGroup(name, description, isPrivate, token){
    try {
        if(!isAStringAndNotEmpty(name)) throw new error.BadRequest("Group name must be a non-empty string")
        const userID = (await getUserByToken(token)).id
        let res = await (data.createGroupForUser(userID, name, description, isPrivate))
        return new bodies.GroupCreatedResponse(res)
    } catch(e) { throw e }
}

export async function addMovieToGroup(movieID, groupID, token){
    try { 
        const user = await getUserByToken(token)
        if(!isThisUserTheOwnerOfThisGroup(user.userObj, groupID)) throw new error.Forbidden("You're not the owner of this group")
        let res = await (data.addMovieToGroupOfAUser(user.userObj.api_key, movieID, groupID))
        return new bodies.GeneralServerResponse(`Added movie -> ${res.movie}`)
    } catch(e) { throw e }
}

/**
 * @param {number?} skip 
 * @param {number?} limit
 * @param {string} token 
 */
export async function getGroupList(skip, limit, token){
    try {
        const userID = (await getUserByToken(token)).id
        if(!skip)  skip = 0
        if(!limit) limit = 10
        let res = await (data.getGroupListOfAUser(skip, limit, userID))

        return new bodies.GroupsListResponse(res)
    } catch(e) { throw e }
}

export async function updateGroup(groupID, groupName, groupDescription, token){
    try {
        if(!isAStringAndNotEmpty(groupName)) throw new error.BadRequest("Group name must be a non-empty string")
        if(!isAStringAndNotEmpty(groupDescription)) throw new error.BadRequest("Group description must be a non-empty string")
        const user = await getUserByToken(token)
        if(!isThisUserTheOwnerOfThisGroup(user.userObj, groupID)) throw new error.Forbidden("You're not the owner of this group")
        return await (data.updateGroup(groupID, groupName, groupDescription))
    } catch(e) { throw e }
}

export async function deleteGroup(groupID, token){
    try {
        const user = await getUserByToken(token)
        if(!isThisUserTheOwnerOfThisGroup(user.userObj, groupID)) throw new error.Forbidden("You're not the owner of this group")
        let res = await (data.deleteGroup(groupID, user.id))
        return new bodies.GeneralServerResponse(`Deleted group w/ id -> ${res.groupID} from user -> ${res.userName}`)
    } catch(e) { throw e }
}

/**
 * @param {number} groupID 
 * @param {string} token 
 * @returns {Promise<Group>} 
 */
export async function getGroup(groupID, token){
    try {
        const user = await getUserByToken(token)
        if(!isThisUserTheOwnerOfThisGroup(user.userObj, groupID)) throw new error.Forbidden("You're not the owner of this group")
        return await data.getGroup(groupID)
    } catch(e) { throw e }
}

export async function removeMovieFromGroup(groupID, movieID, token){
    try {
        const user = await getUserByToken(token)
        if(!isThisUserTheOwnerOfThisGroup(user.userObj, groupID)) throw new error.Forbidden("You're not the owner of this group")
        let res = await (data.removeMovieFromGroup(groupID, movieID, user.id))
        return new bodies.GeneralServerResponse(`Deleted movie w/ id -> ${res.movieID} from group -> ${res.groupName}`)
    } catch(e) { throw e }
}

export async function getTopMovies(numOfTopMovies, token){
    try {
        const foundUser = await getUserByToken(token)
        if(!foundUser) throw new error.NotFound("User not found")
        const userAPIKey = foundUser.userObj.api_key
        return await imdbAPI.imdb_getTopMovies(numOfTopMovies, userAPIKey)
    } catch(e) { throw e }
}

export async function searchMovie(searchTerms, skip, limit, token){
    try {
        const userAPIKey = (await getUserByToken(token)).userObj.api_key
        if(skip==undefined) skip = 0
        if(limit==undefined) limit = 10
        return await imdbAPI.imdb_searchMovie(searchTerms, skip, limit, userAPIKey)
    } catch(e) { throw e }    
}

export async function getMovie(movieID, token){
    try {
        const userAPIKey = (await getUserByToken(token)).userObj.api_key
        return await data.getMovieFromDBorIMDB(movieID, userAPIKey)
    } catch(e) { throw e }    
}

export async function getActor(actorID, token){
    try {
        const userAPIKey = (await getUserByToken(token)).userObj.api_key
        return await data.getActorFromDBorIMDB(actorID, userAPIKey)
    } catch(e) { throw e }    
}

// Auxiliary functions:

function isAStringAndNotEmpty(value) {
    return typeof value == 'string' && value != ""
}

async function getUserByToken(token){
    const foundUser = await data.tryFindUserBy_(token, null, null)
    if(!foundUser) throw new error.NotFound("User not found")
    return foundUser
}

/**
 * This function is used when a user tries to add or remove a movie from a group, or update or delete the group
 * @param {UserObj} user 
 * @param {string} groupID 
 * @returns {boolean}
 */
function isThisUserTheOwnerOfThisGroup(user, groupID){
    return user.groups.some(id => {
        return id==groupID
    })
}
