// Contains functions responsible for using the IMDB API in order to get movies, using a users key (cmdb-imdb-api-access)

import fetch from "node-fetch"
import { BadRequest } from "../utils/errors-and-codes.mjs"
import { processPaging } from "../utils/paging.mjs"
import { Actor, MovieObj, MovieActor, ActorObj, Movie } from "./cmdb-data-objs.mjs"

const IMDB_getMovieById = (key, movieID) => `https://imdb-api.com/en/API/Title/${key}/${movieID}` //https://imdb-api.com/api/#Title-header
const IMDB_top250Movies = (key) => `https://imdb-api.com/en/API/Top250Movies/${key}` //https://imdb-api.com/api/#Top250Movies-header
const IMDB_searchMovie = (key, searchTerms) => `https://imdb-api.com/en/API/SearchMovie/${key}/${searchTerms}` //https://imdb-api.com/api/#SearchMovie-header
const IMDB_getActorById = (key, actorID) => `https://imdb-api.com/en/API/Name/${key}/${actorID}` //https://imdb-api.com/api/#Name-header

/**
 * @param {string} api_key 
 * @param {string} movieID
 * @return {Promise<Movie | null>}
 */
export async function imdb_getMovie(api_key, movieID){
    if(typeof movieID!= 'string' || typeof api_key!= 'string') throw new BadRequest(`api_key and movieID must be provided. api_key=${api_key}. movieID=${movieID}`)
    let URI = IMDB_getMovieById(api_key, movieID)
    return fetch(URI).then(response => {
        return response.json().then(obj => {
            const movieWithOurProps = extractMovieProperties(obj)
            console.log("\nMovie obtained from imdb API -> "+JSON.stringify(movieWithOurProps), "\n")
            return movieWithOurProps
        })
    }).catch(e => {
        console.log("Movie not found? Invalid API key?"+e)
        return null
    })
}

const extractMovieProperties = (obj) => { 
    return new Movie(obj.id, new MovieObj(
        obj.title,
        obj.plot,
        obj.image,
        obj.runtimeMins,
        obj.directors,
        obj.actorList.map(actor => {
            return new MovieActor(actor.id, actor.name)
        })
    ))
}

let cachedTopResults = []

export async function imdb_getTopMovies(numOfTop, api_key){
    const topNmovies = []

    /* SOLELY TO AVOID REPETITIVE REQUESTS TO THE API */
    if(cachedTopResults.length!=0){
        console.log("obtaining cached top movies results")
        const paging = processPaging(0, numOfTop, cachedTopResults.length)
        if(paging!=null){
            for (let i = paging.startIndex; i <= paging.limitIndex; i++){
                topNmovies.push(getTopMoviesItemArrayObjProperties(cachedTopResults[i]))
            }
        }
        const jsonResponse = {top: topNmovies}
        return jsonResponse
    }
    /* *************************************************** */

    let URI = IMDB_top250Movies(api_key)
    return fetch(URI).then(response => {
        return response.json().then(obj => {
            cachedTopResults = obj.items
            for (let i = 0; i < numOfTop; i++){
                topNmovies.push(getTopMoviesItemArrayObjProperties(cachedTopResults[i]))
            }
            const jsonResponse = {top: topNmovies}
            console.log("\nTop movies obtained ="+JSON.stringify(jsonResponse), "\n")
            return jsonResponse
        })
    }).catch(e => {
        console.log(e)
        return null
    })
}

const getTopMoviesItemArrayObjProperties = (obj) => { return { 
    id: obj.id,
    rank: obj.rank,
    name: obj.title
}}

let cachedResults = new Array({ //this initialization is solely to give the types to intelissense
    terms: "",
    results: {}
})

/**
 * @param {string} searchTerms 
 * @param {number} skip 
 * @param {number} limit 
 * @param {string} api_key 
 * @returns {Promise<MovieSearchResult | null>}
 */
export async function imdb_searchMovie(searchTerms, skip, limit, api_key){
    const moviesFound = []

    /* SOLELY TO AVOID REPETITIVE REQUESTS TO THE API */
    let indexOfSameTerms = cachedResults.findIndex(value => {
        return value.terms==searchTerms
    })

    if(indexOfSameTerms!=-1){
        console.log("obtaining cached results")
        const results = cachedResults[indexOfSameTerms].results
        const paging = processPaging(skip, limit, results.length)
        if(paging!=null){
            for (let i = paging.startIndex; i <= paging.limitIndex; i++){
                moviesFound.push(new MovieSearchResultItem(results[i]))
            }
        }
        return new MovieSearchResult(moviesFound)
    }
    /* *************************************************** */

    let URI = IMDB_searchMovie(api_key, searchTerms)
    return fetch(URI).then(response => {
        return response.json().then(obj => {
            const resultsArray = obj.results

            cachedResults.push({terms: searchTerms, results: resultsArray})
            
            const paging = processPaging(skip, limit, resultsArray.length)
            if(paging!=null){
                for (let i = paging.startIndex; i <= paging.limitIndex; i++){
                    
                    moviesFound.push(new MovieSearchResultItem(resultsArray[i]))
                }
            }
            const jsonResponse = new MovieSearchResult(moviesFound)
            console.log("\nMovies obtained ="+JSON.stringify(jsonResponse), "\n")
            return jsonResponse
        })
    }).catch(e => {
        console.log(e)
        return null
    })
}

class MovieSearchResult {
    /**
     * @type {found: Array<MovieSearchResultItem>} found
     * @property {found}
     * @param {Array<MovieSearchResultItem>} items 
     */
    constructor(items){
        this.found = items
    }
}

class MovieSearchResultItem {
    /**
     * @property {string} id
     * @property {string} title
     * @property {string} description
     * @param {Object} obj 
     */
    constructor(obj){
        this.id = obj.id; this.title = obj.title; this.description = this.description
    }
}

export async function imdb_getActor(api_key, actorID){
    if(typeof actorID!= 'string' || typeof api_key!= 'string') throw new BadRequest(`api_key and actorID must be provided. api_key=${api_key}. actorID=${actorID}`)
    let URI = IMDB_getActorById(api_key, actorID)
    return fetch(URI).then(response => {
        return response.json().then(obj => {
            const actor = new Actor(actorID, new ActorObj(obj.image, obj.name, obj.birthDate))
            console.log("\nActor obtained from imdb API -> "+JSON.stringify(actor),"\n")
            return actor
        })
    }).catch(e => {
        console.log("Actor not found?"+e)
        return null
    })
}


