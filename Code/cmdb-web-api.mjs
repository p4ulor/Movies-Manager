import { Response } from 'node-fetch'
import * as services from './cmdb-services.mjs'
import * as utils from './utils.mjs'

export async function signUpUser(req, rsp) {
    try {
        doesBodyContainProps(req.body, utils.newUserRequest)
        const newUserToken = await services.userSignInOrLogin(req.body, true)
        rsp.status(utils.statusCodes.OK).json({token: newUserToken})
    } catch(e) {
        if(e.code) rsp.status(e.code).json({error: e.message})
        else rsp.status(utils.statusCodes.INTERNAL_SERVER_ERROR).json({error: e})
    }
}

export async function loginUser(req, rsp) {
    try {
        doesBodyContainProps(req.body, utils.newUserRequest)
        const tokenOfTheUser = await services.userSignInOrLogin(req.body, false)
        rsp.status(utils.statusCodes.OK).json({token: tokenOfTheUser})
    } catch(e) {
        if(e.code) rsp.status(e.code).json({error: e.message})
        else rsp.status(utils.statusCodes.INTERNAL_SERVER_ERROR).json({error: e})
    }
}

export async function createGroup(req, rsp){
    try {
        const token = getHeaderToken(req)
        doesBodyContainProps(req.body, utils.newGroupRequest)
        await services.createGroup(req.body, token) //must have await!!! Or it crashes and says: UnhandledPromiseRejectionWarning: Error: Group name must be a non-empty string in case of error, instead of going to the catch
        rsp.status(utils.statusCodes.OK).json() //I must have the .json() to respond or the client will wait forever? Hmmm
    } catch(e) {
        if(e.code) rsp.status(e.code).json({error: e.message})
        else rsp.status(utils.statusCodes.INTERNAL_SERVER_ERROR).json({error: e})
    }
}

export async function addMovieToGroup(req, rsp){
    try {
        const token = getHeaderToken(req)
        doesBodyContainProps(req.body, utils.addMovieToGroupRequest)
        const paramGroupID = req.params.groupID //gets :groupID
        await services.addMovieToGroup(req.body.id, paramGroupID, token)
        rsp.status(utils.statusCodes.OK).json() 
    } catch(e) {
        if(e.code) rsp.status(e.code).json({error: e.message})
        else rsp.status(utils.statusCodes.INTERNAL_SERVER_ERROR).json({error: e})
    }
}


//aux functions:
function doesBodyContainProps(body, props){ //note/TODO: it doesnt check the type!
    var propsKeys = Object.keys(props)
    let missingProp = undefined
    propsKeys.every(key => {
        if(!body.hasOwnProperty(key)){
            missingProp = key
            return false
        }
        else return true
    })
    if(missingProp) throw new utils.BadRequest(`Missing field -> ${missingField}`)
}

function getHeaderToken(req){
    try { return req.headers['authorization'].split(" ")[1] } 
    catch(e) { throw new utils.Forbidden("You are not logged in")}
}