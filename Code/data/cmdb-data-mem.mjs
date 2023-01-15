'use strict'

import * as imdbAPI from './imdb-movies-data.mjs'
import { BadRequest, Conflict, Forbidden, NotFound } from '../utils/errors-and-codes.mjs';
import { Group, Actor, MovieActor, User, Movie} from './cmdb-data-objs.mjs'
import * as utils from '../utils/utils.mjs'

const crypto = await import('node:crypto')

const users = [
    new User(0, 'paulo',
        [
        new Group(0, "fav", "fav of all time", true), 
        new Group(1, "watch later", "No time", true, ["tt0120663", "tt0110912"], 313) //actually I have watched these movies, dont roast me please, I am big movies watcher myself ;D
        ],
        'f7c59d82-8a6a-436d-96e0-dd2758a37ab1',
        '7fcd2055b9bb7f567714d426e3e948c0f6bbd906f895d8c72863f7be571ec07d', //password=ay
        'b3a8bd6c42ff7c1670fda5f625878f85',
        "k_25f649os"
    ),
    new User(1, 'carlos',
        [
        new Group(0, "fav", "fav of all time", true), 
        new Group(1, "watch later", "No time", true, ["tt0120663", "tt0110912"], 313)
        ],
        'f7c59d82-8a6a-436d-96e0-dd2758a37ab2', //2, XD
        '7fcd2055b9bb7f567714d426e3e948c0f6bbd906f895d8c72863f7be571ec07d', //password=ay
        'b3a8bd6c42ff7c1670fda5f625878f85',
        "k_8puzazju"
    )
]

const actorsLibrary = [
    new Actor("nm0000129",
    "https://m.media-amazon.com/images/M/MV5BYTFlOTdjMjgtNmY0ZC00MDgxLThjNmEtZGIxZTQyZDdkMTRjXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_Ratio1.0000_AL_.jpg",
    "Tom Cruise", "1962-7-3"),

    new Actor("nm0000173", 
    "https://m.media-amazon.com/images/M/MV5BMTk1MjM5NDg4MF5BMl5BanBnXkFtZTcwNDg1OTQ4Nw@@._V1_Ratio1.0000_AL_.jpg",
    "Nicole Kidman", "1967-6-20"),

    new Actor("nm0000237", 
    "https://m.media-amazon.com/images/M/MV5BMTMyMjZlYzgtZWRjMC00OTRmLTllZTktMmM1ODVmNjljMTQyXkEyXkFqcGdeQXVyMTExNzQ3MzAw._V1_Ratio1.0000_AL_.jpg",
    "John Travolta", "1954-2-18"),

    new Actor("nm0000235", 
    "https://m.media-amazon.com/images/M/MV5BMjMxNzk1MTQyMl5BMl5BanBnXkFtZTgwMDIzMDEyMTE@._V1_Ratio1.0000_AL_.jpg",
    "Uma Thurman", "1970-5-29")
]

const moviesLibrary = [
    new Movie("tt0120663", "Eyes Wide Shut", 
            "A Manhattan doctor embarks on a bizarre, night-long odyssey after his wife's admission of unfulfilled longing.",
            "https://m.media-amazon.com/images/M/MV5BYzMzZjcyNzEtZjE2OC00Yjk3LWExOGItODdhNzhkZTdmM2M0XkEyXkFqcGdeQXVyMjUzOTY1NTc@._V1_Ratio0.6762_AL_.jpg",
            159, "Stanley Kubrick", [ new MovieActor("nm0000129", "Tom Cruise"), new MovieActor("nm0000173", "Nicole Kidman") /* ... */]),

    new Movie("tt0110912", "Pulp Fiction",
            "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
            "https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItYzViMjE3YzI5MjljXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_Ratio0.6904_AL_.jpg",
            154, "Quentin Tarantino", [new MovieActor("nm0000237", "John Travolta"), new MovieActor("nm0000235", "Uma Thurman") /* ... */])
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
        const saltAndHashedPW = utils.hashPassword(password)
        const token = crypto.randomUUID()
        const newUser = new User(nextUserID(), name, [], token, saltAndHashedPW.hashedPassword, saltAndHashedPW.salt, api_key)
        console.log("New user -> ", newUser)
        users.push(newUser)
        return {token: token, userID: newUser.id}
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
        
        /* if(groupFound.movies.length!=0){ //check if movie is already in the group
            const isDuplicate = groupFound.movies.some(movie => {
                return movie==movieID
            })
            if(isDuplicate) throw new Conflict("You already have that movie in the list")
        } */

        let movie = await getMovieFromDBorIMDB(movieID, user.api_key)
        
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

/**
 * @type {msg: string}
 * @param {number} groupID
 * @param {number} userID
 * @returns {Promise<Message>}
 */
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
 * @param {number} groupID
 * @param {number} userID
 * @returns {Promise<Group>}
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
            return getMovieFromDBorIMDB(movieID, user.api_key, true)
        }))
        return clonedGroup //returns group details normally, except that insteaf of returning array of strings (id's) of the movies, it returns the movies in objects of type Movie
    } catch(e) { throw e }
}

/**
 * @type {msg: string} Message
 * @param {number} groupID 
 * @param {string} movieID 
 * @param {string} token 
 * @returns {Promise<Message>}
 */
export async function removeMovieFromGroup(groupID, movieID, token){
    try {
        const user = await tryFindUserBy_(null, token)
        const groupIndex = getIndexOfAGroupOfAUserById(user.groups, groupID)
        const group = user.groups[groupIndex]
        const movieIndex = getIndexOfAMovieOfAGroup(group, movieID)
        const movieToRemove = await getMovieFromDBorIMDB(movieID, user.token)

        group.movies.splice(movieIndex, 1)
        group.totalDuration -= movieToRemove.duration
        return {msg: `Deleted movie -> ${movieToRemove.name} from group -> ${group.name}`}
    } catch(e) { throw e }
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
    //let index = -1
    let index = 0
    const movieFound = group.movies.find(movieID => {
        index++
        return movieID==movieID
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
 * @param {string} movieID
 * @param {string} api_key
 * @param {boolean} justShowPreview If true shows id, name and description of movie, otherwise returns all info of Movie
 * @returns {Promise<Movie>} either gets the movie from our DB if exists or imdb if not
 */
export async function getMovieFromDBorIMDB(movieID, api_key, justShowPreview){
    console.log("Called getMovieFromDB_or_IMDB", `Preview: ${justShowPreview}`)
    if(typeof movieID!= 'string' || typeof api_key!= 'string') throw new BadRequest(`userAPIKey and movieID must be provided. userAPIKey=${api_key}. movieID=${movieID}`)
    let movie = findMovieInServerDB(movieID)
    if(movie==undefined){
        movie = await imdbAPI.imdb_getMovie(api_key, movieID)
        if(movie==null) throw new BadRequest(`Movie w ID doesn't exist`)
        moviesLibrary.push(movie)
    } else console.log("Obtained movie from our DB")
    if(justShowPreview) return movie.getPreview()
    else return movie
}

/**
 * @param {string} actorID 
 * @returns {Actor | undefined} A actor if found or undefined otherwise
 */
function findActorInServerDB(actorID){
    return actorsLibrary.find(actor => {
        return actor.id==actorID
    })
}

export async function getActorFromDBorIMDB(actorID, api_key){
    console.log(`Called getActorFromDBorIMDB, actorID=${actorID}`)
    if(typeof actorID!= 'string' || typeof api_key!= 'string') throw new BadRequest(`userAPIKey and actorID must be provided. userAPIKey=${api_key}. actorID=${actorID}`)
    let actor = findActorInServerDB(actorID)
    if(actor==undefined){
        actor = await imdbAPI.imdb_getActor(api_key, actorID)
        if(actor==null) throw new BadRequest(`Actor w ID=${actorID} doesn't exist`)
        actorsLibrary.push(actor)
    } else console.log("Obtained actor from our DB")
    return actor
}
