import * as imdbapi from './cmdb-movies-data.mjs'
import { BadRequest, Forbidden } from './utils.mjs';

// Our data source / data storage
const crypto = await import('node:crypto');

class Group {
    constructor(name, description, isPrivate){
        this.name = name, //uses as unique key / id
        this.description = description,
        this.isPrivate = isPrivate,
        this.movies = []
        
        this.addMovie = function addMovie(newMovie){
            if(!newMovie instanceof Movie) throw new Error("Can only add movies of type Movie")
            this.movies.push(newMovie)
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
    {
        id: 0,
        name: 'paulo',
        groups: [new Group("fav", "fav of all time", true)],
        token: 'f7c59d82-8a6a-436d-96e0-dd2758a37ab1',
        hash: '7fcd2055b9bb7f567714d426e3e948c0f6bbd906f895d8c72863f7be571ec07d',
        salt: 'b3a8bd6c42ff7c1670fda5f625878f85',
        api_key: "k_25f649os"
    }
]

let nextUserID = () => users.length

export async function createUser(name, password){
    const saltAndHashedPW = hashPassword(password)
    const token = crypto.randomUUID()
    const newUser = {id: nextUserID(), name, groups: [], token, hash: saltAndHashedPW.hashedPassword, salt: saltAndHashedPW.salt}
    console.log("New user -> ", newUser)
    users.push(newUser)
    return token
}

export async function loginUser(name, password){
    const userFound = users.find(user=> { 
        return user.name==name //MUST HAVE RETURN!, unlike kotlin IIRC
    })
    if(userFound==undefined) return undefined
    if(verifyPassword(password, userFound.hash, userFound.salt)) return userFound.token
    return false
}

export async function getUserByToken(){ return users.find(user=> { return user.token==arguments[0]})}
export async function getUserByID(){ return users.find(user=> { return user.id==arguments[0]})}
export async function getIndexOfUserByID(){ return users.findIndex(user=> { return user.id==arguments[0]})}

export async function createGroupForUser(id, name, description, isPrivate){
    const userIndex = await getIndexOfUserByID(id)
    if(userIndex==-1) throw new Error("User not found in data-mem")
    //check if name of group is not repetitive
    users[userIndex].groups.forEach(group=> {
        if(group.name==name) throw new Error(`There's already a group with name = ${name}`)
    })
    users[userIndex].groups.push(new Group(name, description, isPrivate))
    console.log("User's new data -> "+JSON.stringify(users[userIndex]))
}

export async function addMovieToGroupOfAUser(id, movieID, group){
    const userIndex = await getIndexOfUserByID(id)
    if(userIndex==-1) throw new Error("User not found in data-mem")
    const groupFound = users[userIndex].groups.find(g => {
        return g.name==group
    })
    //check if movie is already in the group
    if(groupFound.movies.length!=0){
        const isDuplicate = groupFound.movies.any(movie => {
            return movie.id==movieID
        })
        if(isDuplicate) throw new Conflict("You already have that movie in the list")
    }
    

    //get movie in IMDB by id, and get name and duration, using the user's api key
    const movie = await imdbapi.imdb_API_getMovie(users[userIndex].api_key, movieID)
    if(movie==null) throw new BadRequest("Movie ID doesn't exist")
    groupFound.movies.push(new Movie(movie.name, movieID, movie.duration))
    console.log("addMovieToGroupOfAUser -> "+JSON.stringify(users[userIndex]))
}



//Auxiliary functions:
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
