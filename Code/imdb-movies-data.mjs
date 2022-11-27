// Contains functions responsible for using the IMDB API in order to get movies, using a users key (cmdb-imdb-api-access)

import fetch from "node-fetch"

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
    duration: obj.runtimeMins
}}

export async function imdb_getTopMovies(numOfTop, userAPIKey){
    let URI = IMDB_top250Movies(userAPIKey)
    return fetch(URI).then(response => {
        return response.json().then(obj => {
            const itemsArray = obj.items
            const topNmovies = []
            for (let i = 0; i < numOfTop; i++){
                topNmovies.push(getTopMoviesItemArrayObjProperties(itemsArray[i]))
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

export async function imdb_searchMovie(searchTerms, limit, userAPIKey){
    let URI = IMDB_searchMovie(userAPIKey, searchTerms)
    return fetch(URI).then(response => {
        return response.json().then(obj => {
            const resultsArray = obj.results
            const moviesFound = []
            for (let i = 0; i < limit; i++){
                moviesFound.push(searchMovieObjProperties(resultsArray[i]))
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
