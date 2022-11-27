import * as dataMem from './cmdb-data-mem.mjs'
import * as imdbAPI from './imdb-movies-data.mjs'
import * as utils from './utils.mjs'

export async function userSignInOrLogin(body, isSignIn) {
    try { 
        if(!isAStringAndNotEmpty(body.name)) throw new utils.BadRequest("User name must be a non-empty string")
        if(isSignIn) return await dataMem.createUser(body.name, body.password, body.api_key)
        else {
            const token = await dataMem.loginUser(body.name, body.password)
            console.log("token ->"+token)
            if(token==false) throw new utils.Unauthorized("Wrong password")
            else return token
        }
    } catch(e) { throw e }
}

export async function createGroup(body, token){
    try {
        if(!isAStringAndNotEmpty(body.name)) throw new utils.BadRequest("Group name must be a non-empty string")
        const userID = await getUserIDByToken(token)
        return await dataMem.createGroupForUser(userID, body.name, body.description, body.isPrivate)  
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

export async function getGroup(groupID, token){
    try {
        const userID = await getUserIDByToken(token)
        return await dataMem.getGroup(groupID, userID)
    } catch(e) { throw e }
}

export async function removeMovieFromGroup(groupID, movieID, token){
    try {
        const userID = await getUserIDByToken(token)
        return await dataMem.removeMovieFromGroup(groupID, movieID, userID)
    } catch(e) { throw e }
}

export async function getTopMovies(numOfTopMovies, token){
    try {
        const userAPIKey = await (await dataMem.tryFindUserBy_(false, token)).api_key
        return await imdbAPI.imdb_getTopMovies(numOfTopMovies, userAPIKey)
    } catch(e) { throw e }
}

export async function searchMovie(searchTerms, limit, token){
    try {
        const userAPIKey = await (await dataMem.tryFindUserBy_(false, token)).api_key
        return await imdbAPI.imdb_searchMovie(searchTerms, limit, userAPIKey)
    } catch(e) { throw e }    
}

// Auxiliary functions:
function isAStringAndNotEmpty(value) {
    return typeof value == 'string' && value != ""
}

async function getUserIDByToken(token){
    return  (await dataMem.tryFindUserBy_(false, token)).id
    
}