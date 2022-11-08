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
        if(token==false) throw new utils.Unathorized("Wrong password")
        
        else return token

    }
}

export async function createGroup(body, token){
    if(!isAStringAndNotEmpty(body.name)) throw new utils.BadRequest("Group name must be a non-empty string")
    
}


// Auxiliary functions:
function isAStringAndNotEmpty(value) {
    return typeof value == 'string' && value != ""
}