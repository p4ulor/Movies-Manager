// Contains functions responsible for using the IMDB API in order to get movies, using a users key (cmdb-imdb-api-access)

import fetch from "node-fetch"
import { processPaging } from "../utils/paging.mjs"

const IMDB_getMovieById = (key, movieID) => `https://imdb-api.com/en/API/Title/${key}/${movieID}`
const IMDB_top250Movies = (key) => `https://imdb-api.com/en/API/Top250Movies/${key}`
const IMDB_searchMovie = (key, searchTerms) => `https://imdb-api.com/en/API/SearchMovie/${key}/${searchTerms}`

export async function imdb_getMovie(userAPIKey, movieID){
    let URI = IMDB_getMovieById(userAPIKey, movieID)
    return fetch(URI).then(response => {
        return response.json().then(obj => {
            const movieWithOurProps = getMovieProperties(obj)
            console.log("Movie obtained from imdb API -> "+JSON.stringify(movieWithOurProps))
            return movieWithOurProps
        })
    }).catch(e => {
        console.log("Movie not found?"+e)
        return null
    })
}

const getMovieProperties = (obj) => { return { 
    id: obj.id, 
    name: obj.title, 
    duration: obj.runtimeMins,
    imageURL: obj.image
}}

let cachedTopResults = []

export async function imdb_getTopMovies(numOfTop, userAPIKey){
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

    let URI = IMDB_top250Movies(userAPIKey)
    return fetch(URI).then(response => {
        return response.json().then(obj => {
            cachedTopResults = obj.items
            for (let i = 0; i < numOfTop; i++){
                topNmovies.push(getTopMoviesItemArrayObjProperties(cachedTopResults[i]))
            }
            const jsonResponse = {top: topNmovies}
            console.log("Top movies obtained ="+JSON.stringify(jsonResponse))
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

export async function imdb_searchMovie(searchTerms, skip, limit, userAPIKey){
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
                moviesFound.push(searchMovieObjProperties(results[i]))
            }
        }
        return {found: moviesFound}
    }
    /* *************************************************** */

    let URI = IMDB_searchMovie(userAPIKey, searchTerms)
    return fetch(URI).then(response => {
        return response.json().then(obj => {
            const resultsArray = obj.results

            cachedResults.push({terms: searchTerms, results: resultsArray})
            
            const paging = processPaging(skip, limit, resultsArray.length)
            if(paging!=null){
                for (let i = paging.startIndex; i <= paging.limitIndex; i++){
                    moviesFound.push(searchMovieObjProperties(resultsArray[i]))
                }
            }
            const jsonResponse = {found: moviesFound}
            console.log("Movies obtained ="+JSON.stringify(jsonResponse))
            return jsonResponse
        })
    }).catch(e => {
        console.log(e)
        return null
    })
}

const searchMovieObjProperties = (obj) => { return { 
    id: obj.id,
    title: obj.title,
    description: obj.description
}}
