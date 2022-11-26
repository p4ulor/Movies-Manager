import * as imdbAPI from './imdb-movies-data.mjs'
import { BadRequest, Conflict, Forbidden, NotFound } from './utils.mjs';

const crypto = await import('node:crypto')

class Group {
    /* #movies */ //We thinked about using private members https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields https://stackoverflow.com/a/52237988/9375488
    constructor(id, name, description, isPrivate, movies, totalDuration){
        this.id = id,
        this.name = name,
        this.description = description,
        this.isPrivate = isPrivate,
       /*  this.#movies = (movies) ? movies : [] */
        this.movies = (movies) ? movies : []
        this.totalDuration = (totalDuration) ? totalDuration : 0
        this.addMovie = function addMovie(newMovie){
            if(!newMovie instanceof Movie) throw new Error("Can only add movies of type Movie")
            this.movies.push(newMovie)
            this.totalDuration +=newMovie.duration
        }
    }
}

class Movie {
    constructor(name, id, duration){
        this.name = name,
        this.id = id
        this.duration = duration //in minutes
    }
}

class User {
    constructor(id, name, groups, token, hash, salt, api_key){
        this.id = id
        this.name = name
        this.groups = groups
        this.token = token
        this.hash = hash
        this.salt = salt
        this.api_key = api_key
    }
}

const users = [
    new User(0,'paulo',
        [
        new Group(0, "fav", "fav of all time", true), 
        new Group(1, "watch later", "No time", true, [new Movie("Eyes Wide Shut", "tt0120663", 159), new Movie("Pulp Fiction","tt0110912", 154)], 313)
        ],
        'f7c59d82-8a6a-436d-96e0-dd2758a37ab1',
        '7fcd2055b9bb7f567714d426e3e948c0f6bbd906f895d8c72863f7be571ec07d',
        'b3a8bd6c42ff7c1670fda5f625878f85',
        "k_25f649os"
    )
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
        if(await tryFindUserBy_(false, false, name)) throw new Conflict(`There's already a user with name=${name}`)
        const saltAndHashedPW = hashPassword(password)
        const token = crypto.randomUUID()
        const newUser = new User(nextUserID(), name, [], token, saltAndHashedPW.hashedPassword, saltAndHashedPW.salt, api_key)
        console.log("New user -> ", newUser)
        users.push(newUser)
        return token
    } catch(e) { throw e }
}

export async function loginUser(name, password){
    try {
        const userFound = await tryFindUserBy_(false, false, name)
        if(verifyPassword(password, userFound.hash, userFound.salt)) return userFound.token
        return false
    } catch(e) { throw e }
}

export async function createGroupForUser(userID, name, description, isPrivate){
    try {
        const user = await tryFindUserBy_(userID)
        const userGroups = user.groups
        userGroups.forEach(group=> { //check if name of group is not repetitive
            if(group.name==name) throw new Error(`There's already a group with name = ${name}`)
        })
        userGroups.push(new Group(nextGroupID(), name, description, isPrivate))

        console.log("User's new data -> "+JSON.stringify(user))
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

        //get movie in IMDB by id, and get name and duration, using the user's api key
        const movie = await imdbAPI.imdb_getMovie(user.api_key, movieID)
        if(movie==null) throw new BadRequest("Movie ID doesn't exist")
        groupFound.addMovie(new Movie(movie.name, movieID, movie.duration))
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

export async function getGroup(groupID, userID){
    try {
        const user = await tryFindUserBy_(userID)
        return user.groups.find(g => {
            return g.id==groupID
        })
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

//Auxiliary function for querying
export async function tryFindUserBy_(id, token, name) { 
    const userFound = users.find(user=> { 
        if(id || id==0 /*-_-*/) return user.id==id
        if(name) return user.name==name
        if(token) return user.token==token
        else false
    })
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