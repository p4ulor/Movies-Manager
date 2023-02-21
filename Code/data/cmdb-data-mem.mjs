'use strict'

import * as imdbAPI from './imdb-movies-data.mjs'
import { BadRequest, Conflict, Forbidden, NotFound } from '../utils/errors-and-codes.mjs';
import { Group, Actor, MovieActor, User, Movie, UserObj, GroupObj, ActorObj, GroupMovie, MovieObj} from './cmdb-data-objs.mjs'
import * as utils from '../utils/utils.mjs'
import * as bodies from '../utils/req-resp-bodies.mjs'
import { serve } from 'swagger-ui-express';

const crypto = await import('node:crypto')

/////////////// DUMMY DB DATA /////////
const users = [
    new User(0, new UserObj('paulo',
        ["0", "1"],
        'f7c59d82-8a6a-436d-96e0-dd2758a37ab1',
        '7fcd2055b9bb7f567714d426e3e948c0f6bbd906f895d8c72863f7be571ec07d', //password=ay
        'b3a8bd6c42ff7c1670fda5f625878f85',
        "k_25f649os")
    ),
    new User(1, new UserObj('carlos',
        ["0", "1"],
        'f7c59d82-8a6a-436d-96e0-dd2758a37ab2', //2, XD
        '7fcd2055b9bb7f567714d426e3e948c0f6bbd906f895d8c72863f7be571ec07d', //password=ay
        'b3a8bd6c42ff7c1670fda5f625878f85',
        "k_8puzazju")
    )
]

const groupsLibrary = [
    new Group("0", new GroupObj("fav", "fav of all time", true)),
    new Group("1", new GroupObj("watch later", "No time", true, [new GroupMovie("tt0120663", "Eyes Wide Shut", 159), new GroupMovie("tt0110912", "Pulp Fiction", 154)], 313))
]

const actorsLibrary = [
    new Actor("nm0000129", new ActorObj("https://m.media-amazon.com/images/M/MV5BYTFlOTdjMjgtNmY0ZC00MDgxLThjNmEtZGIxZTQyZDdkMTRjXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_Ratio1.0000_AL_.jpg",
    "Tom Cruise", "1962-7-3")),

    new Actor("nm0000173", new ActorObj("https://m.media-amazon.com/images/M/MV5BMTk1MjM5NDg4MF5BMl5BanBnXkFtZTcwNDg1OTQ4Nw@@._V1_Ratio1.0000_AL_.jpg",
    "Nicole Kidman", "1967-6-20")),

    new Actor("nm0000237", new ActorObj("https://m.media-amazon.com/images/M/MV5BMTMyMjZlYzgtZWRjMC00OTRmLTllZTktMmM1ODVmNjljMTQyXkEyXkFqcGdeQXVyMTExNzQ3MzAw._V1_Ratio1.0000_AL_.jpg",
    "John Travolta", "1954-2-18")),

    new Actor("nm0000235", new ActorObj("https://m.media-amazon.com/images/M/MV5BMjMxNzk1MTQyMl5BMl5BanBnXkFtZTgwMDIzMDEyMTE@._V1_Ratio1.0000_AL_.jpg",
    "Uma Thurman", "1970-5-29"))
]

const moviesLibrary = [
    new Movie("tt0120663", new MovieObj("Eyes Wide Shut", 
            "A Manhattan doctor embarks on a bizarre, night-long odyssey after his wife's admission of unfulfilled longing.",
            "https://m.media-amazon.com/images/M/MV5BYzMzZjcyNzEtZjE2OC00Yjk3LWExOGItODdhNzhkZTdmM2M0XkEyXkFqcGdeQXVyMjUzOTY1NTc@._V1_Ratio0.6762_AL_.jpg",
            159, "Stanley Kubrick", [ new MovieActor("nm0000129", "Tom Cruise"), new MovieActor("nm0000173", "Nicole Kidman") /* ... */])),

    new Movie("tt0110912",  new MovieObj("Pulp Fiction",
            "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
            "https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItYzViMjE3YzI5MjljXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_Ratio0.6904_AL_.jpg",
            154, "Quentin Tarantino", [new MovieActor("nm0000237", "John Travolta"), new MovieActor("nm0000235", "Uma Thurman") /* ... */]))
]

//the following 2 counters and 2 functions are required since users (not for this assignment though) or groups can be deleted. And it would cause inconsistencies or other problems if we used the lenght as the ID
let userIDCount = 2
let groupIDCount = 2
let nextUserID = () => {
    return userIDCount++
}
let nextGroupID = () => {
    return groupIDCount++
}

export async function createUser(name, password, api_key){
    try {
        const saltAndHashedPW = utils.hashPassword(password)
        const token = crypto.randomUUID()
        const newUser = new User(nextUserID(), new UserObj(name, [], token, saltAndHashedPW.hashedPassword, saltAndHashedPW.salt, api_key))
        console.log("New user -> ", newUser)
        users.push(newUser)
        return {token: newUser.userObj.token, id: newUser.id}
    } catch(e) { throw e }
}

/**
 * @param {string} userID 
 * @param {string} name 
 * @param {string} description 
 * @param {boolean} isPrivate 
 */
export async function createGroupForUser(userID, name, description, isPrivate){
    try {
        const user = await getUserByID(userID)
        const userGroups = user.userObj.groups

        // Removed this because of the new functional requirement -> i) Support more than one group with the same name, irrespective of its owner user.
        /* userGroups.forEach(group=> { //check if name of group is not repetitive
            if(group.name==name) throw new Error(`There's already a group with name = ${name}`)
        }) */

        const id = nextGroupID()
        const groupToAdd = new Group(id, new GroupObj(name, description, isPrivate))
        userGroups.push(id)
        groupsLibrary.push(groupToAdd)
        console.log("User's new data -> "+JSON.stringify(user))
        return id
    } catch(e) { throw e }
}

/**
 * @param {string} api_key 
 * @param {string} movieID 
 * @param {string} groupID 
 */
export async function addMovieToGroupOfAUser(api_key, movieID, groupID){
    try {
        const movie = await getMovieFromDBorIMDB(movieID, api_key)
        const group = await getGroupByID(groupID)
        
        /* if(groupFound.movies.length!=0){ //check if movie is already in the group
            const isDuplicate = groupFound.movies.some(movie => {
                return movie==movieID
            })
            if(isDuplicate) throw new Conflict("You already have that movie in the list")
        } */
        group.groupObj.addMovie(movie.id, movie.movieObj.name, movie.movieObj.duration)

        console.log(`addMovieToGroupOfAUser: Group -> ${JSON.stringify(group)}`)
        return {movie: movie.movieObj.name}
    } catch(e) { throw e }
}

export async function getGroupListOfAUser(skip, limit, userID){
    try {
        const user = await getUserByID(userID)
        const groupsFound = user.userObj.groups.slice(skip, skip+limit).map(groupID => {
            return getGroupByID(groupID).then(group => {
                console.log(JSON.stringify(group))
                return new bodies.GroupsItemListResponse(group.id, group.groupObj.name)
            }).catch(e => {throw e})
        })
        const resolvedGroupsFound = await Promise.all(groupsFound) //https://stackoverflow.com/a/48273841/9375488
        return resolvedGroupsFound
    } catch(e) { throw e }
}

export async function updateGroup(groupID, name, description){
    try {
        const group = await getGroupByID(groupID)
        group.groupObj.name = name
        group.groupObj.description = description
        console.log("Groups new data -> "+JSON.stringify(group))
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
        const user =  await getUserByID(userID)
        const groupIndex = getIndexOfAGroupOfAUserById(user.userObj.groups, groupID)
        user.userObj.groups = utils.removeIndex(user.userObj.groups, groupIndex)
        console.log("User groups new data -> "+JSON.stringify(user.userObj.groups))

        const indexToRemove = groupsLibrary.findIndex(group => {
            return group.id==groupID
        })
        groupsLibrary.splice(indexToRemove, 1)

        console.log("Groups library new data -> "+JSON.stringify(groupsLibrary))

        return {groupID: groupID, userName: user.userObj.name}
    } catch(e) { throw e }
}

/**
 * @param {number} groupID
 * @param {number} userID
 * @returns {Promise<Group>}
 */
export async function getGroup(groupID){
    try { return await getGroupByID(groupID)
    } catch(e) { throw e }
}

/**
 * @type {msg: string} Message
 * @param {number} groupID 
 * @param {string} movieID 
 * @param {string} token 
 * @returns {Promise<Message>}
 */
export async function removeMovieFromGroup(groupID, movieID){
    try {
        const group = await getGroupByID(groupID)
        const wasMovieRemovedSuccessful = group.groupObj.removeMovie(movieID)
        if(wasMovieRemovedSuccessful){
            return {movieID: movieID , groupName: group.groupObj.name}
        } 
        else throw new NotFound(`Movie w/ id=${movieID} in group w/ id=${groupID} not found`)
    } catch(e) { throw e }
}

//Auxiliary function for querying. When used for createUser, onlyCheckIfItExists=true. Just to say if a user w/ same name exists
//For all the other uses, a call to this function is intended to return the user
/**
 * @param {string} token 
 * @param {string} name 
 * @param {boolean} onlyCheckIfItExists 
 * @returns 
 */
export async function tryFindUserBy_(token, name, onlyCheckIfItExists) {
    let search = ""
    //if(id || id===0) search = "id"
    if(name) search = "name"
    if(token) search = "token"
    console.log("Trying to find user by", search)
    const userFound = users.find(user=> { 
        //if(id || id===0 /*-_-*/) return user.id==id
        if(name) return user.userObj.name==name
        if(token) return user.userObj.token==token
        /* else return false */
    })
    if(onlyCheckIfItExists) return userFound!=undefined
    return userFound
}

/**
 * @param {number} id 
 * @return {Promise<User>}
 */
 export async function getUserByID(id) {
    if(id==undefined || id<0 && id!==0) throw new Error(`Invalid ID=${id}`)
    const userFound = users.find(user=> { return user.id==id})
    if(!userFound) throw new NotFound(`User w/ id=${id} not found`)
    return userFound
}

/**
 * @param {number} id 
 * @return {Promise<Group>}
 */
export async function getGroupByID(id){
    if(id==undefined|| id<0 && id!==0) throw new Error(`Invalid ID=${id}`)
    const groupFound = groupsLibrary.find(group=> { return group.id==id})
    if(!groupFound) throw new NotFound(`Group w/ id=${id} not found`)
    return groupFound
}
/**
 * @param {Array<string>} groupsOfTheUser 
 * @param {string} groupID 
 * @returns {number}
 */
function getIndexOfAGroupOfAUserById(groupsOfTheUser, groupID){
    let index = -1
    const groupFound = groupsOfTheUser.find(id => {
        index++
        return id==groupID
    })
    if(!groupFound) throw new BadRequest(`Group with id ${groupID} not found`)
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
        console.log(`\nInserted movie -> ${JSON.stringify(movie)} to our DB\n`)
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

/**
 * @param {string} actorID 
 * @param {string} api_key 
 * @returns {Promise<Actor>}
 */
export async function getActorFromDBorIMDB(actorID, api_key){
    console.log(`Called getActorFromDBorIMDB, actorID=${actorID}`)
    if(typeof actorID!= 'string' || typeof api_key!= 'string') throw new BadRequest(`userAPIKey and actorID must be provided. userAPIKey=${api_key}. actorID=${actorID}`)
    let actor = findActorInServerDB(actorID)
    if(actor==undefined){
        actor = await imdbAPI.imdb_getActor(api_key, actorID)
        if(actor==null) throw new BadRequest(`Actor w ID=${actorID} doesn't exist`)
        actorsLibrary.push(actor)
        console.log(`\nInserted actor -> ${JSON.stringify(actor)} to our DB\n`)
    } else console.log("Obtained actor from our DB")
    return actor
}
