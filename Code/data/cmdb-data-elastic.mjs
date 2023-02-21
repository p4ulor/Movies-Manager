'use strict' //lembrar q o prof disse q isto podia dar problemas em certos sitios nao era?

import * as imdbAPI from './imdb-movies-data.mjs'
import { BadRequest, Conflict, Forbidden, NotFound, ServerError } from '../utils/errors-and-codes.mjs';
import { User, UserObj, Group, GroupObj, Movie, MovieObj, Actor, ActorObj, assignGroup} from './cmdb-data-objs.mjs'
import elasticFetch from '../utils/elastic-fetch.mjs'
import * as bodies from '../utils/req-resp-bodies.mjs'
import * as utils from '../utils/utils.mjs'

/** @param {ServerConfig} config */
function elasticDB(config){

    const elasticFetx = elasticFetch(config)

    const ourIndexes = {
        users: "users",
        groups: "groups",
        movies: "movies",
        actors: "actors"
    }
    
    function createOurIndexes(){ 
        Object.values(ourIndexes).forEach(indexName => {
            elasticFetx.doesIndexExist(indexName).then(doesExist =>{
                if(!doesExist){
                    elasticFetx.createIndex(indexName)
                    console.log("created", indexName)
                }
            })  
        })
    }

    createOurIndexes()
    
    async function createUser(name, password, api_key){
        try {
            const saltAndHashedPW = utils.hashPassword(password)
            const token = utils.crypto.randomUUID()
            let newUser = new UserObj(name, [], token, saltAndHashedPW.hashedPassword, saltAndHashedPW.salt, api_key)
            console.log("New user -> ", newUser)
    
            return elasticFetx.createDoc(ourIndexes.users, newUser).then(obj => {
                return {token: token, id: obj._id}
            })
        } catch(e) { throw e }
    }
    
    /**
     * @param {string} userID 
     * @param {string} name 
     * @param {string} description 
     * @param {boolean} isPrivate 
     */
    async function createGroupForUser(userID, name, description, isPrivate){
        try {
            let user = await getUserByID(userID)
    
            let group = new GroupObj(name, description, true)
    
            let createdGroupID = ""
    
            return await elasticFetx.createDoc(ourIndexes.groups, group).then(async obj =>{
                user.userObj.groups.push(obj._id)
                console.log("Created the group")
                createdGroupID = obj._id
                return await elasticFetx.updateDoc(ourIndexes.users, user.id, user.userObj).then(obj =>{
                    console.log("Linked the created group to the user")
                    return createdGroupID
                })   
            })
        } catch(e) { throw e }
    }
    
    /**
     * @param {string} api_key 
     * @param {string} movieID 
     * @param {string} groupID 
     */
    async function addMovieToGroupOfAUser(api_key, movieID, groupID){
        try {
            const movie = await getMovieFromDBorIMDB(movieID, api_key, false)
            return await elasticFetx.getDoc(ourIndexes.groups, groupID).then(obj => {
                console.log(JSON.stringify(obj))
                if(obj.found==false) return null
                return obj._source
            }).then(async group => {
                console.log("Group obtained", JSON.stringify(group))
                const theGroup = assignGroup(group) //just so we make use of the .addMovie() function
                theGroup.addMovie(movie.id, movie.movieObj.name, movie.movieObj.duration)
                return await elasticFetx.updateDoc(ourIndexes.groups, groupID, theGroup).then(obj =>{
                    return {movie: movie.name}
                })
            })
        } catch(e) { throw e }
    }
    
    async function getGroupListOfAUser(skip, limit, userID){
        try {
            const user = await getUserByID(userID)
            const groupsFound = user.userObj.groups.slice(skip, skip+limit).map(groupID => {
                return elasticFetx.getDoc(ourIndexes.groups, groupID).then(obj => {
                    console.log(JSON.stringify(obj))
                    if(obj.found==false) throw new NotFound(`The user w/ id=${userID} has the group w/ id=${groupID} but it wasn't found in the index 'groups'`)
                    return {id: obj._id, groupObj: obj._source}
                }).then (group => {
                    return new bodies.GroupsItemListResponse(group.id, group.groupObj.name)
                })
            })
            const resolvedGroupsFound = await (Promise.all(groupsFound)) //https://stackoverflow.com/a/48273841/9375488
            return resolvedGroupsFound
        } catch(e) { throw e }
    }
    
    async function updateGroup(groupID, name, description){
        try {
            elasticFetx.getDoc(ourIndexes.groups, groupID).then(obj => {
                if(obj.found==false) throw new NotFound(`Group whose id=${groupID} not found`)
                const group = new Group(obj._id, obj._source)
                group.groupObj.name = name
                group.groupObj.description = description
                elasticFetx.updateDoc(ourIndexes.groups, groupID, group.groupObj).then(obj => {
                    console.log(`updatedGroup ->`, JSON.stringify(obj))
                })
            })
        } catch(e) { throw e }
    }
    
    /**
     * @param {number} groupID
     * @param {number} userID
     */
    async function deleteGroup(groupID, userID){
        try {
            const user = await getUserByID(userID)
    
            return await elasticFetx.deleteDoc(ourIndexes.groups, groupID).then(async obj =>{
                if (obj.result == "deleted"){
                    const groupIndexToRemove = user.userObj.groups.findIndex(grupID => {
                        return grupID==groupID
                    })
                    user.userObj.groups = utils.removeIndex(user.userObj.groups, groupIndexToRemove)
                    return await elasticFetx.updateDoc(ourIndexes.users, userID, user.userObj).then(obj =>{
                        console.log(`\ndeleteGroup elastic response ->\n`, JSON.stringify(obj))
                        return {groupID: groupIndexToRemove.grupID, userName: user.userObj.name}
                    })
                }
                else throw new ServerError(`Deletion of group w/ id=${groupID} failed`)
            })   
        } catch(e) { throw e }
    }
    
    /**
     * @param {number} groupID
     * @returns {Promise<Group | null>}
     */
    async function getGroup(groupID){
        try {
            return elasticFetx.getDoc(ourIndexes.groups, groupID).then(obj => {
                console.log("Obtained group ->", JSON.stringify(obj))
                if(obj.found==false) return null
                return new Group(obj._id, obj._source)
            })
        } catch(e) { throw e }
    }
    
    /**
     * @type {msg: string} Message
     * @param {number} groupID 
     * @param {string} movieID 
     * @param {string} token 
     * @returns {Promise<Message>}
     */
    async function removeMovieFromGroup(groupID, movieID){
        try {
            let group = await elasticFetx.getDoc(ourIndexes.groups, groupID).then(obj => {
                console.log(JSON.stringify(obj))
                if(obj.found==false) throw new NotFound(`Group w/ ID=${groupID} not found`)
                return new Group(obj._id, obj._source)
            })
            
            const theGroup = assignGroup(group.groupObj) //just so we make use of the .addMovie() function
            const wasMovieRemovedSuccessful = theGroup.removeMovie(movieID)
    
            if(wasMovieRemovedSuccessful) {
                return await elasticFetx.updateDoc(ourIndexes.groups, groupID, theGroup).then(obj =>{
                    console.log("removeMovieFromGroup result -> ", JSON.stringify(obj))
                    return {movieID: movieID , groupName: theGroup.name}
                })
            }
            else throw new NotFound(`Movie w/ id=${movieID} in group w/ id=${groupID} not found`)
        } catch(e) { throw e }
    }
    
    //Auxiliary functions for searching actors or movies in our DB (or IMDB if it doesn't exist)
    
    /**
     * @param {string} token //used for services to know if a user exists
     * @param {string} name //used to check if there's already a user with a name of a user to be registered
     * @param {boolean} onlyCheckIfItExists 
     * @returns {Promise <User | boolean | undefined}
     */
    async function tryFindUserBy_(token, name, onlyCheckIfItExists){
        if(!token && !name) throw new Error("Incorrect usage of tryFindUserBy_()")
        function userFound(){
            if(name) {
                console.log("Name " + name)
                return elasticFetx.searchDoc(ourIndexes.users, "name", name).then(obj => {
                    console.log("\nPerformed elastic search->",JSON.stringify(obj))
                    if(obj.hits.hits.length==0) return null
                    return new User(obj.hits.hits[0]._id , obj.hits.hits[0]._source)
                })
            }
            if(token) {
                console.log("Token " + token)
                return elasticFetx.searchDoc(ourIndexes.users, "token", token).then(obj => {
                    console.log("\nPerformed elastic search->",JSON.stringify(obj))
                    if(obj.hits.hits.length==0) return null
                    return new User(obj.hits.hits[0]._id , obj.hits.hits[0]._source)
                })
            }
            else return null
        }
    
        const user_Found = await userFound()
        if(onlyCheckIfItExists) return user_Found!=null
        return user_Found
    }
    
    /**
     * @param {number} id 
     * @return {Promise<User>}
     */
    async function getUserByID(id) {
        if(!id || id<1) throw new Error(`Invalid ID=${id}`)
    
        return elasticFetx.getDoc(ourIndexes.users, id).then(obj => {
            console.log(JSON.stringify(obj))
            if(obj.found==false) throw new NotFound(`User with id=${id} not found`)
            return new User(obj._id , obj._source)
        })
    }
    
    /**
     * @param {string} movieID 
     * @returns {Promise<Movie | null>} A movie if found or null otherwise
     */
    async function findMovieInServerDB(movieID){
        return await elasticFetx.getDoc(ourIndexes.movies, movieID).then(obj => {
            if(obj.found==false) return null
            return new Movie(obj._id, obj._source) 
        })
    }
    
    /**
     * @param {string} movieID
     * @param {string} api_key
     * @param {boolean} justShowPreview If true, shows id, name and description of movie, otherwise returns all info of Movie
     * @returns {Promise<Movie>} either gets the movie from our DB if exists or imdb if not
     */
    async function getMovieFromDBorIMDB(movieID, api_key, justShowPreview){
        console.log("Called getMovieFromDB_or_IMDB", `Preview: ${justShowPreview}`)
        if(typeof movieID!= 'string' || typeof api_key!= 'string') throw new BadRequest(`userAPIKey and movieID must be provided. userAPIKey=${api_key}. movieID=${movieID}`)
        let movie = await findMovieInServerDB(movieID)
        if(!movie){
            movie = await imdbAPI.imdb_getMovie(api_key, movieID)
            if(movie==null) throw new BadRequest(`Movie w/ ID=${movieID} doesn't exist`)
    
            //Add obtained movie to our DB
            elasticFetx.createDocWithID(ourIndexes.movies, movie.movieObj, movie.id).then(obj => {
                console.log(`\nInserted movie -> ${JSON.stringify(movie)} to our DB\n`)
            })
        } 
        else console.log("Obtained movie from our DB")
    
        if(justShowPreview) return movie.getPreview()
        else return movie
    }
    
    /**
     * @param {string} actorID 
     * @returns {Promise<Actor | null>} A actor if found or null otherwise
     */
    async function findActorInServerDB(actorID){
        return await elasticFetx.getDoc(ourIndexes.actors, actorID).then(obj => {
            if(obj.found==false) return null
            console.log(`\nActor obtained from our DB -> ${JSON.stringify(obj)}\n`)
            return new Actor(obj._id, obj._source) 
        })
    }
    
    /**
     * @param {string} actorID 
     * @param {string} api_key 
     * @returns {Promise<Actor>}
     */
    async function getActorFromDBorIMDB(actorID, api_key){
        console.log(`Called getActorFromDBorIMDB, actorID=${actorID}`)
        if(typeof actorID!= 'string' || typeof api_key!= 'string') throw new BadRequest(`userAPIKey and actorID must be provided. userAPIKey=${api_key}. actorID=${actorID}`)
        let actor = await findActorInServerDB(actorID)
        if(!actor){
            actor = await imdbAPI.imdb_getActor(api_key, actorID)
            if(actor==null) throw new BadRequest(`Actor w ID=${actorID} doesn't exist`)
    
            //Add obtained actor to our DB
            elasticFetx.createDocWithID(ourIndexes.actors, actor.actorObj, actor.id).then(obj => {
                console.log(`\nInserted actor -> ${JSON.stringify(actor)} to our DB\n`)
            })
        } 
        else console.log("Obtained actor from our DB")
        return actor
    }
    
    return {
        ourIndexes,
        createOurIndexes,
        createUser,
        createGroupForUser,
        addMovieToGroupOfAUser,
        getGroupListOfAUser,
        updateGroup,
        deleteGroup,
        getGroup,
        removeMovieFromGroup,
        tryFindUserBy_,
        getMovieFromDBorIMDB,
        getActorFromDBorIMDB
    }
}

export default elasticDB