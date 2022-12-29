'use strict'

import * as imdbAPI from './imdb-movies-data.mjs'
import { BadRequest, Conflict, Forbidden, NotFound } from '../utils/errors-and-bodies.mjs';

const crypto = await import('node:crypto')

class Group {
    /* #movies */ //We thinked about using private members https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields https://stackoverflow.com/a/52237988/9375488

    /** https://stackoverflow.com/a/31420719/9375488 https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html
     * @param {number} id
     * @param {string} name
     * @param {string} description
     * @param {boolean} isPrivate
     * @param {Array<string>} movies
     * @param {number} totalDuration
     */
    constructor(id, name, description, isPrivate, movies, totalDuration){
        this.id = id, this.name = name, this.description = description, this.isPrivate = isPrivate,
        this.movies = (movies) ? movies : []
        this.totalDuration = (totalDuration) ? totalDuration : 0

        /**
         * @param {string} newMovieID 
         * @param {number} duration
         */
        this.addMovie = function addMovie(newMovieID, duration){
            if(!newMovieID instanceof String) throw new Error("Can only add movies of type string")
            if(isNaN(new Number(duration))) throw new Error("Can only add movies with valid duration of type number")
            this.movies.push(newMovieID)
            this.totalDuration = duration + totalDuration
        }
    }
}

class Movie {
    /**
     * @param {string} name 
     * @param {string} id 
     * @param {number} duration in minutes
     * @param {string} imageURL 
     */
    constructor(name, id, duration, imageURL){
        this.name = name, this.id = id; this.duration = duration; this.imageURL = imageURL
    }
}

class User {
    /**
     * @param {number} id
     * @param {string} name
     * @param {Array<Group>} groups
     * @param {string} token
     * @param {string} hash
     * @param {string} salt
     * @param {string} api_key
     */
    constructor(id, name, groups, token, hash, salt, api_key){
        this.id = id; this.name = name; this.groups = groups; this.token = token; this.hash = hash; this.salt = salt; this.api_key = api_key
    }
}

const users = [
    new User(0,'paulo',
        [
        new Group(0, "fav", "fav of all time", true), 
        new Group(1, "watch later", "No time", true, ["tt0120663", "tt0110912"], 313)
        ],
        'f7c59d82-8a6a-436d-96e0-dd2758a37ab1',
        '7fcd2055b9bb7f567714d426e3e948c0f6bbd906f895d8c72863f7be571ec07d',
        'b3a8bd6c42ff7c1670fda5f625878f85',
        "k_25f649os"
    )
]

const moviesLibrary = [
    new Movie("Eyes Wide Shut", "tt0120663", 159, "https://m.media-amazon.com/images/M/MV5BYzMzZjcyNzEtZjE2OC00Yjk3LWExOGItODdhNzhkZTdmM2M0XkEyXkFqcGdeQXVyMjUzOTY1NTc@._V1_Ratio0.6762_AL_.jpg"),
    new Movie("Pulp Fiction","tt0110912", 154, "https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItYzViMjE3YzI5MjljXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_Ratio0.6904_AL_.jpg")
]

//the following 2 counters and 2 functions are required since users (not for this assignment though) or groups can be deleted. And it would cause inconsistencies or other problems if using the lenght as a counter
let userIDCount = 1
let groupIDCount = 2
let nextUserID = () => {
    return userIDCount++
}
let nextGroupID = () => {
    return groupIDCount++
}

export async function createUser(name, password, api_key){
    try {
        if(await tryFindUserBy_(false, false, name, true)) throw new Conflict(`There's already a user with name=${name}`)
        const saltAndHashedPW = hashPassword(password)
        const token = crypto.randomUUID()
        const newUser = new User(nextUserID(), name, [], token, saltAndHashedPW.hashedPassword, saltAndHashedPW.salt, api_key)
        console.log("New user -> ", newUser)
        users.push(newUser)
        return {token: token, userID: newUser.id}
    } catch(e) { throw e }
}

export async function loginUser(name, password){
    try {
        const userFound = await tryFindUserBy_(false, false, name)
        if(verifyPassword(password, userFound.hash, userFound.salt)) return {token: userFound.token, userID: userFound.id}
        return false
    } catch(e) { throw e }
}

export async function createGroupForUser(userID, name, description, isPrivate){
    try {
        const user = await tryFindUserBy_(userID)
        const userGroups = user.groups

        // Removed this because of the new functional requirement -> i) Support more than one group with the same name, irrespective of its owner user.
        /* userGroups.forEach(group=> { //check if name of group is not repetitive
            if(group.name==name) throw new Error(`There's already a group with name = ${name}`)
        }) */

        const id = nextGroupID()
        userGroups.push(new Group(id, name, description, isPrivate))
        console.log("User's new data -> "+JSON.stringify(user))
        return {id: id}
    } catch(e) { throw e }
}

export async function addMovieToGroupOfAUser(userID, movieID, groupID){
    try {
        let user = await tryFindUserBy_(userID)
        const groupFound = user.groups[getIndexOfAGroupOfAUserById(user.groups, groupID)]
        
        if(groupFound.movies.length!=0){ //check if movie is already in the group
            const isDuplicate = groupFound.movies.some(movie => {
                return movie.id==movieID
            })
            if(isDuplicate) throw new Conflict("You already have that movie in the list")
        }

        let movie = getMovieFromDBorIMDB(movieID, user.api_key)
        
        groupFound.addMovie(movieID, movie.duration)
        console.log("addMovieToGroupOfAUser -> "+JSON.stringify(user))
        return {msg: `Added movie -> ${movie.name}`}
    } catch(e) { throw e }
}

export async function getGroupListOfAUser(skip, limit, userID){
    try {
        const user = await tryFindUserBy_(userID)
        const groupsFound = user.groups.slice(skip, skip+limit).map(g => { return {id: g.id, name: g.name}})
        return groupsFound
    } catch(e) { throw e }
}

export async function updateGroup(userID, groupID, name, description){
    try {
        const user = await tryFindUserBy_(userID)
        const userGroups = user.groups
        const isNameAlreadyInUse = userGroups.some(group => {
            return (group.name==name && group.id!=groupID)
        })
        if(isNameAlreadyInUse) throw new Conflict(`There's already a group with that name=${name}`)
        let resultGroup
        userGroups.forEach(group => {
            if(group.id==groupID) {
                group.name = name
                group.description = description
                resultGroup = group
            }
        })
        console.log("User's new data -> "+JSON.stringify(user))
        return {id: resultGroup.id, name: resultGroup.name, description: resultGroup.description}
    } catch(e) { throw e }
}

export async function deleteGroup(groupID, userID){
    try {
        const user = await tryFindUserBy_(userID)
        const groupIndex = getIndexOfAGroupOfAUserById(user.groups, groupID)
        const groupName = user.groups[groupIndex].name
        user.groups.splice(groupIndex, 1)
        return {msg: `Deleted group -> ${groupName}`}
    } catch(e) { throw e }
}

/**
 * @type {}
 * @param {number} groupID 
 * @param {number} userID 
 * @returns 
 */
export async function getGroup(groupID, userID){
    try {
        const user = await tryFindUserBy_(userID)
        const group = user.groups.find(g => {
            return g.id==groupID
        })
        if(group==undefined) throw new NotFound(`Group with id=${groupID} not found`)
        const clonedGroup = JSON.parse(JSON.stringify(group)) //this is so we dont affect the OG object. We are doing it like to avoid defining an
        clonedGroup.movies = await Promise.all(clonedGroup.movies.map(movieID => { //https://stackoverflow.com/a/48273841/9375488 -_-
            return getMovieFromDBorIMDB(movieID, user.api_key)
        }))
        return clonedGroup //returns group details normally, except that insteaf of returning array of strings (id's) of the movies, it returns the movies in objects of type Movie
    } catch(e) { throw e }
}

export async function removeMovieFromGroup(groupID, movieID, userID){
    try {
        const user = await tryFindUserBy_(userID)
        const groupIndex = getIndexOfAGroupOfAUserById(user.groups, groupID)
        const group = user.groups[groupIndex]
        const movieIndex = getIndexOfAMovieOfAGroup(group, movieID)
        const movieToRemove =  group.movies[movieIndex]

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
export async function tryFindUserBy_(id, token, name, onlyCheckIfItExists) {
    let search = ""
    if(id || id===0) search = "id"
    if(name) search = "name"
    if(token) search = "token"
    console.log("Trying to find user by", search)
    const userFound = users.find(user=> { 
        if(id || id===0 /*-_-*/) return user.id==id
        if(name) return user.name==name
        if(token) return user.token==token
        /* else return false */
    })
    if(onlyCheckIfItExists) return userFound!=undefined
    if(!userFound) throw new NotFound("User not found")
    return userFound
}

function getIndexOfAGroupOfAUserById(groupsOfTheUser, groupID){
    let index = -1
    const groupFound = groupsOfTheUser.find(group => {
        index++
        return group.id==groupID
    })
    if(!groupFound) throw new BadRequest(`Group with id ${groupID} not found`)
    return index
}

function getIndexOfAMovieOfAGroup(group, movieID) { 
    let index = -1
    const movieFound = group.movies.find(movie => {
        index++
        return movie.id==movieID
    })
    if(!movieFound) throw new BadRequest(`Movie with id ${movieID} not found`)
    return index
}

/**
 * @param {string} movieID 
 * @returns {Movie | undefined} A movie if found or undefined otherwise
 */
function findMovieInServerDB(movieID){
    return moviesLibrary.find(movie => {
        return movie.id==movieID
    })
}

/**
 * 
 * @param {string} movieID
 * @param {string} api_key
 * @returns {Promise<Movie>} either gets the movie from our DB if exists or imdb if not
 */
export async function getMovieFromDBorIMDB(movieID, api_key){
    if(!movieID || !api_key) throw new BadRequest(`userAPIKey and movieID must be provided. api_key=${api_key}. movieID=${movieID}`)
    console.log("getMovieFromDBorIMDB")
    let movie = findMovieInServerDB(movieID)
    if(movie==undefined){
        movie = await imdbAPI.imdb_getMovie(api_key, movieID)
        if(movie==null) throw new BadRequest(`Movie w ID doesn't exist`)
        moviesLibrary.push(new Movie(movie.name, movieID, movie.duration, movie.imageURL))
    } else console.log("Obtained movie from our DB")
    return movie
}
