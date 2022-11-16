import * as data from './cmdb-data-mem.mjs'
import * as utils from './utils.mjs'

export async function userSignInOrLogin(body, isSignIn) {
    if(!isAStringAndNotEmpty(body.name)) throw new utils.BadRequest("User name must be a non-empty string")
    // TODO: Check if there's a user with the same name
    if(isSignIn) return data.createUser(body.name, body.password)
    else {
        const token = await data.loginUser(body.name, body.password)
        
        console.log("token ->"+token)
        if(token==undefined) throw new utils.NotFound("User not found")
        if(token==false) throw new utils.Unauthorized("Wrong password")
        
        else return token

    }
}

export async function createGroup(body, token){
    if(!isAStringAndNotEmpty(body.name)) throw new utils.BadRequest("Group name must be a non-empty string")
    const userFound = await data.getUserByToken(token)
    if(!userFound) throw new utils.BadRequest("User not found. Invalid token")
    try { data.createGroupForUser(userFound.id, body.name, body.description, body.isPrivate) } 
    catch(e){ throw new utils.BadRequest(e) }
}

export async function addMovieToGroup(movieID, groupName, token){
    const userFound = await data.getUserByToken(token)
    if(!userFound) throw new utils.BadRequest("User not found. Invalid token")
    data.addMovieToGroupOfAUser(userFound.id, movieID, groupName)
}

// Auxiliary functions:
function isAStringAndNotEmpty(value) {
    return typeof value == 'string' && value != ""
}
