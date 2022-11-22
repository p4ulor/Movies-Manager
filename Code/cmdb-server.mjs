// Application Entry Point. 
// Register all HTTP API routes and starts the server

import express from 'express'
import * as api from './cmdb-web-api.mjs'

const PORT = 1904

console.log("Start setting up server")
let app = express()

app.use(express.json())

app.get('/',(req, res) => {
    res.send('Benfica in da building')
})

app.post('/users', api.signUpUser)
app.post('/login', api.loginUser) //delete?
app.post('/groups', api.createGroup)
app.put('/groups/:groupID', api.addMovieToGroup)
app.get('/groups/:userID', api.getGroupList)

/* app.get('/movie', api.getMoviesList)
app.get('/movie/:name', api.getMovieByName)
app.post('/group/:name:description', api.createGroup)
app.put('/group/:id:name:description', api.updateGroup)
app.get('/group', api.getGroupList)
app.delete('/group/:id', api.deleteGroup)
app.post('/group/:idGroup:idMovie', api.addMovieToGroup)
app.delete('/group/:idGroup:idMovie', api.deleteMovieFromGroup) */

app.listen(PORT, () => console.log(`Server listening in http://localhost:${PORT}`))

console.log("End setting up server")

// Route handling functions
