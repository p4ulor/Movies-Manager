export class Group {
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
        this.id = id, this.name = name, this.description = description, this.isPrivate = true,
        this.movies = (movies) ? movies : []
        this.totalDuration = (totalDuration) ? totalDuration : 0

        /**
         * @param {string} newMovieID 
         * @param {number} duration
         */
        this.addMovie = function addMovie(newMovieID, duration){
            if(!newMovieID instanceof String) throw new Error("Can only add movies of type string")
            duration = new Number(duration) //when duration==null (in case of a series/show) the new Number(duration) will return 0
            if(isNaN(duration)) throw new Error("Can only add movies with valid duration of type number")
            this.movies.push(newMovieID)
            this.totalDuration = duration + this.totalDuration
        }
    }
}

export class Actor {
    /**
     * @param {string} id 
     * @param {string} image link
     * @param {string} name 
     * @param {string} birthDate In international format 1995-12-31
     */
    constructor(id, image, name, birthDate){
        this.id = id; this.image = image; this.name = name; this.birthDate = birthDate
    }
}

export class MovieActor {
    /**
     * @param {string} id 
     * @param {string} name 1
     */
    constructor(id, name){ this.id = id; this.name = name;}
}

export class Movie {
    /**
     * @param {string} id 
     * @param {string} name 
     * @param {string} description 
     * @param {string} imageURL A link
     * @param {number} duration in minutes
     * @param {string} director or directors
     * @param {Array<MovieActor>} actorsList
     */
     constructor(id, name, description, imageURL, duration, director, actorsList){
        this.id = id; this.name = name; this.description = description; this.imageURL = imageURL; 
        this.duration = duration; this.director = director; this.actorsList = actorsList
        
        this.getPreview = function getPreview(){
            return new MoviePreview(this.id, this.name, this.description, this.duration)
        }
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

export class User {
    /**
     * @param {number} id ignore this id when using ElasticUser
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

export class ElasticUser {
    /**
     * @param {string} elasticID 
     * @param {User} user 
     */
    constructor(elasticID, user){
        this.elasticID = elasticID; this.user = user
    }
}

