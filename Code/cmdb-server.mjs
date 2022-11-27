// Application Entry Point. 
// Register all HTTP API routes and starts the server

import express from 'express'
import * as api from './cmdb-web-api.mjs'

const PORT = 1904

console.log("Start setting up server")
export let app = express()

app.use(express.json())

app.get('/',(req, res) => {
    res.send('Benfica in da building')
})

app.post('/users', api.signUpUser)
app.post('/login', api.loginUser) //delete?
app.post('/groups', api.createGroup)
app.put('/groups/:groupID/:movieID', api.addMovieToGroup)
app.get('/groups', api.getGroupList) //query params -> skip and limit
app.post('/groups/:groupID', api.updateGroup)
app.delete('/groups/:groupID', api.deleteGroup)
app.get('/groups/:groupID', api.getGroup)
app.delete('/groups/:groupID/:movieID', api.removeMovieFromGroup)

//IMDB calls
app.get('/movies', api.getTopMovies), //query params -> top
app.get('/movies/:searchTerms', api.searchMovie) //query params -> limit

app.listen(PORT, () => console.log(`Server listening in http://localhost:${PORT}`))

console.log("End setting up server")

// Route handling functions
