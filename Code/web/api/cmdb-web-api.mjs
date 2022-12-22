import * as services from '../../services/cmdb-services.mjs'
import * as utils from '../../utils/utils.mjs'

export async function signUpUser(req, rsp) {
    tryCatch(async () => {
        doesBodyContainProps(req.body, utils.newUserRequest)
        const newUserToken = await services.userSignInOrLogin(req.body, true).catch((e) => { throw e})
        rsp.status(utils.statusCodes.OK).json({token: newUserToken})
    }, rsp)
}

export async function loginUser(req, rsp) {
    tryCatch(async () => {
        doesBodyContainProps(req.body, utils.UserLoginRequest)
        const tokenOfTheUser = await services.userSignInOrLogin(req.body, false).catch((e) => { throw e})
        rsp.status(utils.statusCodes.OK).json({token: tokenOfTheUser})
    }, rsp)
}

export async function createGroup(req, rsp){
    tryCatch(async () => {
        const token = getHeaderToken(req)
        doesBodyContainProps(req.body, utils.newGroupRequest)
        const res = await services.createGroup(req.body, token).catch((e) => { throw e})
        rsp.status(utils.statusCodes.OK).json(res) //I must have the .json() to respond or the client will wait forever? Hmmm
    }, rsp)
}

export async function addMovieToGroup(req, rsp){
    tryCatch(async () => {
        const token = getHeaderToken(req)
        const [groupIDPathParam, movieIDPathParam] = doesPathContain_Query_or_Path_Params(req, [new Param("groupID", true), new Param("movieID")], true)
        const res = await services.addMovieToGroup(movieIDPathParam, groupIDPathParam, token).catch((e) => { throw e})
        rsp.status(utils.statusCodes.OK).json(res)
    }, rsp)
}

export async function getGroupList(req, rsp){
    tryCatch(async () => {
        const token = getHeaderToken(req)
        const [skipQueryParam, limitQueryParam] = doesPathContain_Query_or_Path_Params(req, [new Param("skip", true), new Param("limit", true)])
        const ret = await services.getGroupList(skipQueryParam, limitQueryParam, token).catch((e) => { throw e})
        rsp.status(utils.statusCodes.OK).json(ret) 
    }, rsp)
}

export async function updateGroup(req, rsp){
    tryCatch(async () => {
        const token = getHeaderToken(req)
        doesBodyContainProps(req.body, utils.updateGroupRequest)
        const [groupIDPathParam] = doesPathContain_Query_or_Path_Params(req, [new Param("groupID")], true)
        const res = await services.updateGroup(groupIDPathParam, req.body.groupName, req.body.groupDescription, token).catch((e) => { throw e})
        rsp.status(utils.statusCodes.OK).json(res)
    }, rsp)
}

export async function deleteGroup(req, rsp){
    tryCatch(async () => {
        const token = getHeaderToken(req)
        const [groupIDPathParam] = doesPathContain_Query_or_Path_Params(req, [new Param("groupID")], true)
        const res = await services.deleteGroup(groupIDPathParam, token).catch((e) => { throw e})
        rsp.status(utils.statusCodes.OK).json(res)
    }, rsp)
}

export async function getGroup(req, rsp){
    tryCatch(async () => {
        const token = getHeaderToken(req)
        const [groupIDPathParam] = doesPathContain_Query_or_Path_Params(req, [new Param("groupID", true)], true)
        const res = await services.getGroup(groupIDPathParam, token).catch((e) => { throw e})
        rsp.status(utils.statusCodes.OK).json(res)
    }, rsp)
}

export async function removeMovieFromGroup(req, rsp){
    tryCatch(async () => {
        const token = getHeaderToken(req)
        const [groupIDPathParam, movieIDPathParam] = doesPathContain_Query_or_Path_Params(req, [new Param("groupID", true), new Param("movieID")], true)
        const res = await services.removeMovieFromGroup(groupIDPathParam, movieIDPathParam, token).catch((e) => { throw e})
        rsp.status(utils.statusCodes.OK).json(res)
    }, rsp)
}

export async function getTopMovies(req, rsp){
    tryCatch(async () => {
        const token = getHeaderToken(req)
        const [topQueryParam] = doesPathContain_Query_or_Path_Params(req, [new Param("top", true)])
        const ret = await services.getTopMovies(topQueryParam, token).catch((e) => { throw e})
        rsp.status(utils.statusCodes.OK).json(ret)
    }, rsp)
}

export async function searchMovie(req, rsp){
    tryCatch(async () => {
        const token = getHeaderToken(req)
        const [searchTermsPathParam] = doesPathContain_Query_or_Path_Params(req, [new Param("searchTerms")], true)
        const [limitQueryParam] = doesPathContain_Query_or_Path_Params(req, [new Param("limit", true)])
        const ret = await services.searchMovie(searchTermsPathParam, limitQueryParam, token).catch((e) => { throw e})
        rsp.status(utils.statusCodes.OK).json(ret) 
    }, rsp)
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
    if(missingProp) throw new utils.BadRequest(`Missing field -> ${missingProp}`)
}

class Param {
    constructor(name, isNumber){
        this.name = name
        this.isNumber = isNumber
    }
}

function doesPathContain_Query_or_Path_Params(req, arrayOfParams, isPathParams){
    const paramValues = []
    arrayOfParams.forEach(param => {
        const paramValue = (isPathParams) ? req.param(param.name) : req.query[param.name]
        if(!isPathParams && paramValue==undefined) {
            //if query param is missing, do nothing. But since we do [varname1, varname2] we need to fill it or it doesnt match
            paramValues.push(undefined)
        } else {
            if(paramValue==undefined) throw new utils.BadRequest(`Path param :${param.name} is missing`)
            if(param.isNumber && isNaN(Number(paramValue))) throw new utils.BadRequest(`Path param :${param.name} should be of type number, received '${typeof paramValue}' -> '${paramValue}'`)
            else paramValues.push(paramValue)
        }
    })
    return paramValues
}

function getHeaderToken(req){
    try { return req.headers['authorization'].split(" ")[1] } 
    catch(e) { throw new utils.Forbidden("You are not logged in / You have no authorization to perform this action")}
}

async function tryCatch(func, rsp){ //this cuts down 3 lines per api/controller method
    if(typeof func !== 'function') throw new Error("Can't use this function like this. param 'func' must be a function")
    try {
        await func()
    } catch(e) {
        if(e.code) rsp.status(e.code).json({error: e.message})
        else rsp.status(utils.statusCodes.INTERNAL_SERVER_ERROR).json({error: e.message})
    }
}
