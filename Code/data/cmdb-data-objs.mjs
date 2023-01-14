import { removeIndex } from "../utils/utils.mjs";

export class GroupMovie {
    /**
     * We are storing the movies in each Group, tied to it's duration, so that when the user decided to delete the movie, it won't be required to 
     * get the entire movie, just to get it's duration and decrement it to the totalDuration
     * @param {string} id
     * @param {string} name
     * @param {number} duration 
     */
    constructor(id, name, duration){ 
        this.id = id; this.name = name; this.duration = duration
    }
}

export class GroupObj {
    /** https://stackoverflow.com/a/31420719/9375488 https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html
     * @param {string} name
     * @param {string} description
     * @param {boolean} isPrivate (not really in use)
     * @param {Array<GroupMovie>} movies movie id and duration
     * @param {number} totalDuration
     */
    constructor(name, description, isPrivate, movies, totalDuration){
        this.name = name, this.description = description, this.isPrivate = true,
        this.movies = (movies) ? movies : []
        this.totalDuration = (totalDuration) ? totalDuration : 0

        /**
         * @param {string} newMovieID 
         * @param {number} duration
         */
        this.addMovie = function addMovie(newMovieID, movieName, duration){
            if(!newMovieID instanceof String) throw new Error("Can only remove moviesIDs using an identifier that's a string")
            duration = new Number(duration) //when duration==null (in case of a series/show) the new Number(duration) will return 0
            if(isNaN(duration)) throw new Error("Can only add movies with valid duration of type number")
            this.movies.push(new GroupMovie(newMovieID, movieName, duration))
            this.totalDuration = duration + this.totalDuration
        }

        /**
         * 
         * @param {string} movieID 
         * @returns {Boolean} returns true on success, false otherwise
         */
        this.removeMovie = function removeMovie(movieID){
            if(!movieID instanceof String) throw new Error("Can only remove moviesIDs using an identifier that's a string")
            let duration = 0
            const movieIndexToRemove = this.movies.findIndex(movieIDAndDuration => { 
                if(id==movieIDAndDuration.movieID){
                    duration = movieIDAndDuration.duration
                    return true
                }
                else return false
            })
            if(movieIndexToRemove==-1) return false
            this.movies = removeIndex(this.movies, movieIndexToRemove)
            this.totalDuration = this.totalDuration - duration
            return true
        }
    }
}

/**
 * @param {Object} obj hopefully an GroupObj
 */
export function assignGroup(obj){
    return new GroupObj(obj.id, obj.name, obj.description, obj.isPrivate, obj.movies, obj.totalDuration)
}


export class Group { //this insures compatability between data-mem and data-elastic. id must be string because of elastic
    /**
    * @param {string} id 
    * @param {GroupObj} groupObj 
    */
    constructor(id, groupObj){ 
        this.id = id; this.groupObj = groupObj 
    }
}

export class ActorObj {
    /**
     * @param {string} image link
     * @param {string} name 
     * @param {string} birthDate In international format 1995-12-31
     */
    constructor(image, name, birthDate){
        this.image = image; this.name = name; this.birthDate = birthDate
    }
}

export class Actor { //this insures compatability between data-mem and data-elastic
    /**
    * @param {string} id //the same as the imdb key of the actor
    * @param {ActorObj} actorObj 
    */
    constructor(id, actorObj){ 
        this.id = id; this.actorObj = actorObj 
    }
}

export class MovieActor {
    /**
     * This ensures that when consulting a movie, it will not be performed several data calls just to get the names of the actors, 
     * at the cost of having duplicate data (the name) stored in each MovieObj. And it's not data that's likely to change anyways, or data
     * that would cause problems if it's wrong
     * @param {string} id 
     * @param {string} name 
     */
    constructor(id, name){ 
        this.id = id; this.name = name 
    }
}

export class MovieObj {
    /**
     * @param {string} name 
     * @param {string} description 
     * @param {string} imageURL A link
     * @param {number} duration in minutes
     * @param {string} director or directors
     * @param {Array<MovieActor>} actorsList
     */
     constructor(name, description, imageURL, duration, director, actorsList){
        this.name = name; this.description = description; this.imageURL = imageURL; 
        this.duration = duration; this.director = director; this.actorsList = actorsList
        
        this.getPreview = function getPreview(){
            return new MoviePreview(this.id, this.name, this.description, this.duration)
        }
    }
}

export class Movie { //this insures compatability between data-mem and data-elastic. id must be string because of elastic
    /**
    * @param {string} id //the same as the imdb key of the movie
    * @param {MovieObj} movieObj 
    */
    constructor(id, movieObj){ 
        this.id = id; this.movieObj = movieObj 
    }
}

class MoviePreview {
    /**
     * @param {string} id 
     * @param {string} name 
     * @param {string} description 
     */
    constructor(id, name, description, duration){
        this.id = id; this.name = name; this.description = description; this.duration = duration
    }
}

export class UserObj {
    /**
     * @param {string} name
     * @param {Array<string>} groups group id's
     * @param {string} token
     * @param {string} hash
     * @param {string} salt
     * @param {string} api_key
     */
    constructor(name, groups, token, hash, salt, api_key){
        this.name = name; this.groups = groups; this.token = token; this.hash = hash; this.salt = salt; this.api_key = api_key
    }
}

export class User { //this insures compatability between data-mem and data-elastic. id must be string because of elastic
    /**
    * @param {string} id 
    * @param {UserObj} userObj 
    */
    constructor(id, userObj){
        this.id = id; this.userObj = userObj
    }
}

