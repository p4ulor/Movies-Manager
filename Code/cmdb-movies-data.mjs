// Contains functions responsible for using the IMDB API in order to get movies, using a users key (cmdb-imdb-api-access)
import fetch from "node-fetch"

let userIMDB_API = (key) => `https://imdb-api.com/en/API/Title/${key}/`

export async function imdb_API_getMovie(userAPIKey, movieID){
    let URI = userIMDB_API(userAPIKey)+movieID
    return fetch(URI).then(response => {
        return response.json().then(obj => {
            const movieWithOurProps = getMovieProperties(obj)
            console.log("Movie obtained w/ id ="+JSON.stringify(movieWithOurProps))
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
    duration: obj.runtimeMins} 
} 