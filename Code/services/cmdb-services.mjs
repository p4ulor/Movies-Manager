//import * as data from '../data/cmdb-data-mem.mjs'
import * as data from '../data/cmdb-data-elastic.mjs'
import * as imdbAPI from '../data/imdb-movies-data.mjs'
import * as utils from '../utils/errors-and-codes.mjs'
import { User, UserObj, Group, GroupObj, Movie, MovieObj, Actor, ActorObj} from '../data/cmdb-data-objs.mjs'

export async function userSignUpOrLogin(body, isSignUp) {
    try { 
        if(!isAStringAndNotEmpty(body.name)) throw new utils.BadRequest("User name must be a non-empty string")
        const foundUser = await data.tryFindUserBy_(false, body.name)
        if(isSignUp) {
            if(foundUser) throw new Conflict(`There's already a user with name=${name}`)
            return await (data.createUser(body.name, body.password, body.api_key))
        }
        else {
            if(!foundUser) throw new utils.NotFound("User not found")
            const tokenAnduserID = await data.loginUser(foundUser.userObj, body.password)
            console.log("token ->"+JSON.stringify(tokenAnduserID))
            if(tokenAnduserID==false) throw new utils.Unauthorized("Wrong password")
            else return tokenAnduserID
        }
    } catch(e) { throw e }
}

export async function createGroup(name, description, isPrivate, token){
    try {
        if(!isAStringAndNotEmpty(name)) throw new utils.BadRequest("Group name must be a non-empty string")
        const userID = (await getUserByToken(token)).id
        return await data.createGroupForUser(userID, name, description, isPrivate)  
    } catch(e) { throw e }
}

export async function addMovieToGroup(movieID, groupID, token){
    try { 
        const user = await getUserByToken(token)
        if(!isThisUserTheOwnerOfThisGroup(user.userObj, groupID)) throw new utils.Forbidden("You're not the owner of this group")
        return await data.addMovieToGroupOfAUser(user.id, movieID, groupID) 
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
        return data.getGroupListOfAUser(skip, limit, userID)
    } catch(e) { throw e }
}

export async function updateGroup(groupID, groupName, groupDescription, token){
    try {
        if(!isAStringAndNotEmpty(groupName)) throw new utils.BadRequest("Group name must be a non-empty string")
        if(!isAStringAndNotEmpty(groupDescription)) throw new utils.BadRequest("Group description must be a non-empty string")
        const user = await getUserByToken(token)
        if(!isThisUserTheOwnerOfThisGroup(user.userObj, groupID)) throw new utils.Forbidden("You're not the owner of this group")
        return await data.updateGroup(user.id, groupID, groupName, groupDescription)
    } catch(e) { throw e }
}

export async function deleteGroup(groupID, token){
    try {
        const user = await getUserByToken(token)
        if(!isThisUserTheOwnerOfThisGroup(user.userObj, groupID)) throw new utils.Forbidden("You're not the owner of this group")
        return await data.deleteGroup(groupID, user.id)
    } catch(e) { throw e }
}

/**
 * @param {number} groupID 
 * @param {string} token 
 * @returns {data.GroupObj} A group
 */
export async function getGroup(groupID, token){
    try {
        const user = await getUserByToken(token)
        if(!isThisUserTheOwnerOfThisGroup(user.userObj, groupID)) throw new utils.Forbidden("You're not the owner of this group")
        return await data.getGroup(groupID)
    } catch(e) { throw e }
}

export async function removeMovieFromGroup(groupID, movieID, token){
    try {
        const user = await getUserByToken(token)
        if(!isThisUserTheOwnerOfThisGroup(user.userObj, groupID)) throw new utils.Forbidden("You're not the owner of this group")
        return await data.removeMovieFromGroup(groupID, movieID, user.id)
    } catch(e) { throw e }
}

export async function getTopMovies(numOfTopMovies, token){
    try {
        const foundUser = await data.tryFindUserBy_(false, token)
        if(!foundUser) throw new utils.NotFound("User not found")
        const userAPIKey = foundUser.api_key
        return await imdbAPI.imdb_getTopMovies(numOfTopMovies, userAPIKey)
    } catch(e) { throw e }
}

export async function searchMovie(searchTerms, skip, limit, token){
    try {
        const userAPIKey = (await getUserByToken(token)).api_key
        if(skip==undefined) skip = 0
        if(limit==undefined) limit = 10
        return await imdbAPI.imdb_searchMovie(searchTerms, skip, limit, userAPIKey)
    } catch(e) { throw e }    
}

export async function getMovie(movieID, token){
    try {
        const userAPIKey = (await getUserByToken(token)).api_key
        return await data.getMovieFromDBorIMDB(movieID, userAPIKey)
    } catch(e) { throw e }    
}

export async function getActor(actorID, token){
    try {
        const userAPIKey = (await getUserByToken(token)).api_key
        return await data.getActorFromDBorIMDB(actorID, userAPIKey)
    } catch(e) { throw e }    
}

// Auxiliary functions:

function isAStringAndNotEmpty(value) {
    return typeof value == 'string' && value != ""
}

async function getUserByToken(token){
    const foundUser = await data.tryFindUserBy_(token, null, null)
    if(!foundUser) throw new utils.NotFound("User not found")
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
