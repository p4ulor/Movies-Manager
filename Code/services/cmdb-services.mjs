import * as dataMem from '../data/cmdb-data-mem.mjs'
import * as imdbAPI from '../data/imdb-movies-data.mjs'
import * as utils from '../utils/errors-and-bodies.mjs'

export async function userSignInOrLogin(body, isSignIn) {
    try { 
        if(!isAStringAndNotEmpty(body.name)) throw new utils.BadRequest("User name must be a non-empty string")
        if(isSignIn) return await dataMem.createUser(body.name, body.password, body.api_key)
        else {
            const tokenAnduserID = await dataMem.loginUser(body.name, body.password)
            console.log("token ->"+JSON.stringify(tokenAnduserID))
            if(tokenAnduserID==false) throw new utils.Unauthorized("Wrong password")
            else return tokenAnduserID
        }
    } catch(e) { throw e }
}

export async function createGroup(name, description, isPrivate, token){
    try {
        if(!isAStringAndNotEmpty(name)) throw new utils.BadRequest("Group name must be a non-empty string")
        const userID = await getUserIDByToken(token)
        return await dataMem.createGroupForUser(userID, name, description, isPrivate)  
    } catch(e) { throw e }
}

export async function addMovieToGroup(movieID, groupID, token){
    try { 
        const userID = await getUserIDByToken(token)
        return await dataMem.addMovieToGroupOfAUser(userID, movieID, groupID) 
    } catch(e) { throw e }
}

export async function getGroupList(skip, limit, token){
    try {
        const userID = await getUserIDByToken(token)
        return await dataMem.getGroupListOfAUser((skip) ? skip : 0, (limit) ? limit : 50, userID)
    } catch(e) { throw e }
}

export async function updateGroup(groupID, groupName, groupDescription, token){
    try {
        if(!isAStringAndNotEmpty(groupName)) throw new utils.BadRequest("Group name must be a non-empty string")
        if(!isAStringAndNotEmpty(groupDescription)) throw new utils.BadRequest("Group description must be a non-empty string")
        const userID = await getUserIDByToken(token)
        return await dataMem.updateGroup(userID, groupID, groupName, groupDescription)
    } catch(e) { throw e }
}

export async function deleteGroup(groupID, token){
    try {
        const userID = await getUserIDByToken(token)
        return await dataMem.deleteGroup(groupID, userID)
    } catch(e) { throw e }
}

/**
 * @param {number} groupID 
 * @param {string} token 
 * @returns {dataMem.Group} A group
 */
export async function getGroup(groupID, token){
    try {
        const userID = await getUserIDByToken(token)
        return await dataMem.getGroup(groupID, userID)
    } catch(e) { throw e }
}

export async function removeMovieFromGroup(groupID, movieID, token){
    try {
        //const userID = await getUserIDByToken(token)
        return await dataMem.removeMovieFromGroup(groupID, movieID, token)
    } catch(e) { throw e }
}

export async function getTopMovies(numOfTopMovies, token){
    try {
        const userAPIKey = await (await dataMem.tryFindUserBy_(false, token)).api_key
        return await imdbAPI.imdb_getTopMovies(numOfTopMovies, userAPIKey)
    } catch(e) { throw e }
}

export async function searchMovie(searchTerms, skip, limit, token){
    try {
        const userAPIKey = (await dataMem.tryFindUserBy_(false, token)).api_key
        if(skip==undefined) skip = 0
        if(limit==undefined) limit = 10
        return await imdbAPI.imdb_searchMovie(searchTerms, skip, limit, userAPIKey)
    } catch(e) { throw e }    
}

export async function getMovie(movieID, token){
    try {
        const userAPIKey = (await dataMem.tryFindUserBy_(false, token)).api_key
        return await dataMem.getMovieFromDBorIMDB(movieID, userAPIKey)
    } catch(e) { throw e }    
}

export async function getActor(actorID, token){
    try {
        const userAPIKey = (await dataMem.tryFindUserBy_(false, token)).api_key
        return await dataMem.getActorFromDBorIMDB(actorID, userAPIKey)
    } catch(e) { throw e }    
}

// Auxiliary functions:
function isAStringAndNotEmpty(value) {
    return typeof value == 'string' && value != ""
}

async function getUserIDByToken(token){
    return  (await dataMem.tryFindUserBy_(false, token)).id
    
}