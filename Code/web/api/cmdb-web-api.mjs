import * as services from '../../services/cmdb-services.mjs'
import * as codes from '../../utils/errors-and-codes.mjs'
import * as body from '../../utils/req-resp-bodies.mjs'
import { doesBodyContainProps } from '../../utils/utils.mjs'

export async function signUpUser(req, rsp) {
    tryCatch(async () => {
        doesBodyContainProps(req.body, body.newUserRequest)
        const tokenAnduserID = await services.userSignUpOrLogin(req.body, true).catch((e) => { throw e})
        rsp.status(codes.statusCodes.OK).json(tokenAnduserID) //or .end() or text/plain with: send("text")
    }, rsp)
}

export async function loginUser(req, rsp) {
    tryCatch(async () => {
        doesBodyContainProps(req.body, body.UserLoginRequest)
        const tokenAnduserID = await services.userSignUpOrLogin(req.body, false).catch((e) => { throw e})
        rsp.status(codes.statusCodes.OK).json(tokenAnduserID)
    }, rsp)
}

export async function createGroup(req, rsp){
    tryCatch(async () => {
        const token = getHeaderToken(req)
        doesBodyContainProps(req.body, body.newGroupRequest)
        const id = await services.createGroup(req.body.name, req.body.description, req.body.isPrivate, token).catch((e) => { throw e})
        rsp.status(codes.statusCodes.OK).json(new body.GroupCreatedResponse(id))
    }, rsp)
}

export async function addMovieToGroup(req, rsp){
    tryCatch(async () => {
        const token = getHeaderToken(req)
        const [groupIDPathParam, movieIDPathParam] = doesPathContain_Query_or_Path_Params(req, [new Param("groupID"), new Param("movieID")], true)
        const res = await services.addMovieToGroup(movieIDPathParam, groupIDPathParam, token).catch((e) => { throw e})
        rsp.status(codes.statusCodes.OK).json(res)
    }, rsp)
}

export async function getGroupList(req, rsp){
    tryCatch(async () => {
        const token = getHeaderToken(req)
        const [skipQueryParam, limitQueryParam] = doesPathContain_Query_or_Path_Params(req, [new Param("skip", true), new Param("limit", true)])
        const ret = await services.getGroupList(skipQueryParam, limitQueryParam, token).catch((e) => { throw e})
        rsp.status(codes.statusCodes.OK).json(ret) 
    }, rsp)
}

export async function updateGroup(req, rsp){
    tryCatch(async () => {
        const token = getHeaderToken(req)
        doesBodyContainProps(req.body, body.updateGroupRequest)
        const [groupIDPathParam] = doesPathContain_Query_or_Path_Params(req, [new Param("groupID")], true)
        const res = await services.updateGroup(groupIDPathParam, req.body.groupName, req.body.groupDescription, token).catch((e) => { throw e})
        rsp.status(codes.statusCodes.OK).json(res)
    }, rsp)
}

export async function deleteGroup(req, rsp){
    tryCatch(async () => {
        const token = getHeaderToken(req)
        const [groupIDPathParam] = doesPathContain_Query_or_Path_Params(req, [new Param("groupID")], true)
        const res = await services.deleteGroup(groupIDPathParam, token).catch((e) => { throw e})
        rsp.status(codes.statusCodes.OK).json(res)
    }, rsp)
}

export async function getGroup(req, rsp){
    tryCatch(async () => {
        const token = getHeaderToken(req)
        const [groupIDPathParam] = doesPathContain_Query_or_Path_Params(req, [new Param("groupID", true)], true)

        //TODO: Apply paging for the amount of movies returned
        const [skiQueryParam] = doesPathContain_Query_or_Path_Params(req, [new Param("skip", true)])
        const [limitQueryParam] = doesPathContain_Query_or_Path_Params(req, [new Param("limit", true)])

        const res = await services.getGroup(groupIDPathParam, token).catch((e) => { throw e})
        rsp.status(codes.statusCodes.OK).json(res)
    }, rsp)
}

export async function removeMovieFromGroup(req, rsp){
    tryCatch(async () => {
        const token = getHeaderToken(req)
        const [groupIDPathParam, movieIDPathParam] = doesPathContain_Query_or_Path_Params(req, [new Param("groupID", true), new Param("movieID")], true)
        const res = await services.removeMovieFromGroup(groupIDPathParam, movieIDPathParam, token).catch((e) => { throw e})
        rsp.status(codes.statusCodes.OK).json(res)
    }, rsp)
}

//IMDB calls:

export async function getTopMovies(req, rsp){
    tryCatch(async () => {
        const token = getHeaderToken(req)
        const [topQueryParam] = doesPathContain_Query_or_Path_Params(req, [new Param("top", true)])
        const ret = await services.getTopMovies(topQueryParam, token).catch((e) => { throw e})
        rsp.status(codes.statusCodes.OK).json(ret)
    }, rsp)
}

export async function searchMovie(req, rsp){
    tryCatch(async () => {
        const token = getHeaderToken(req)
        const [searchTermsPathParam] = doesPathContain_Query_or_Path_Params(req, [new Param("searchTerms")], null, true)
        const [skiQueryParam] = doesPathContain_Query_or_Path_Params(req, [new Param("skip", true)])
        const [limitQueryParam] = doesPathContain_Query_or_Path_Params(req, [new Param("limit", true)])
        const ret = await services.searchMovie(searchTermsPathParam, skiQueryParam, limitQueryParam, token).catch((e) => { throw e})
        rsp.status(codes.statusCodes.OK).json(ret) 
    }, rsp)
}

export async function getMovie(req, resp){
    tryCatch(async () => {
        const token = getHeaderToken(req)
        const [movieID] = doesPathContain_Query_or_Path_Params(req, [new Param("movieID")], true)
        const ret = await services.getMovie(movieID, token).catch((e) => { throw e})
        resp.status(codes.statusCodes.OK).json(ret) 
    }, resp)
}

export async function getActor(req, resp){
    tryCatch(async () => {
        const token = getHeaderToken(req)
        const [actorID] = doesPathContain_Query_or_Path_Params(req, [new Param("actorID")], true)
        const ret = await services.getActor(actorID, token).catch((e) => { throw e})
        resp.status(codes.statusCodes.OK).json(ret) 
    }, resp)
}

//aux functions:

class Param {
    /**
     * @param {string} name 
     * @param {boolean} isNumber 
     */
    constructor(name, isNumber){
        this.name = name
        this.isNumber = isNumber
    }
}

function doesPathContain_Query_or_Path_Params(req, arrayOfParams, isPathParams, isMandatory){
    const paramValues = []
    arrayOfParams.forEach(param => {
        const paramValue = (isPathParams) ? req.param(param.name) : req.query[param.name]
        if(!isPathParams && paramValue==undefined) {
            //if query param is missing, do nothing. But since we do [varname1, varname2] we need to fill it or it doesnt match
            if(isMandatory) throw new codes.BadRequest(`Query param :${req.query[param.name]} is missing`)
            paramValues.push(undefined)
        } else {
            if(paramValue==undefined) throw new codes.BadRequest(`Path param :${param.name} is missing`)
            if(param.isNumber && isNaN(Number(paramValue))) throw new codes.BadRequest(`Path param :${param.name} should be of type number, received '${typeof paramValue}' -> '${paramValue}'`)
            else paramValues.push(paramValue)
        }
    })
    return paramValues
}

/**
 * Gets bearer token, if there's no bearer token header. it try to gets the cookie. On fail, throws forbidden exception
 * @param {Request} req 
 * @returns {string} token
 */
function getHeaderToken(req){
    let token
    try { token = req.headers['authorization'].split(" ")[1]} 
    catch(e){ //if the cookie wasnt found in authorization, check if its in the cookie
        token = req.cookies.token
        if(token==undefined) 
            throw new codes.Forbidden("You are not logged in / You have no authorization to perform this action")
    }
    return token
}

/**
 * Gets bearer token, if there's no bearer token header. it try to gets the cookie. On fail, throws forbidden exception
 * @param {Request} req 
 * @returns {string} token
 */
function getPassportToken(req){
    try {  
        let token = req.user.token //if user is not defined, .token will throw cannot read property of undefined error, thus the catch
        return token
    } 
    catch(e) { throw new codes.Forbidden("You are not logged in / You have no authorization to perform this action")}
}

async function tryCatch(func, rsp){ //this cuts down 3 lines per api/controller method
    if(typeof func !== 'function') throw new Error("Can't use this function like this. param 'func' must be a function")
    try {
        await func()
    } catch(e) { //e.code is a property that's added to our list of Exceptions
        if(e.code) rsp.status(e.code).json({error: e.message})
        else rsp.status(codes.statusCodes.INTERNAL_SERVER_ERROR).json({error: e.message})
    }
}
