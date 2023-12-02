let skip = true



/* In these tests we use supertest to make the HTTP requests to show we also know how to use it
I tried making test dependent but it didnt work out so well*/

import * as mocha from 'mocha' //mocha (test framework)
const test = mocha.xit //just for a more clear lexic. To disable all tests, replace 'it' with 'xit' https://stackoverflow.com/a/32724129

import request from 'supertest'
import { expect } from 'chai' //chai (assertion library)

import * as server from '../cmdb-server.mjs'
import { apiPaths } from '../web/api/cmdb-web-api.mjs'

console.log("\n---Starting GroupsElastic.test---")
const config = new server.ServerConfig(1908, true, "http://localhost:9200")
let appExpress

try {
    appExpress = await server.server(config)
} catch(e){
    console.log("Error:", e.message)
    console.log("Will just skip test")
    skip = true
}

import * as _elasticFetch from '../utils/elastic-fetch.mjs'
import * as _dataElastic from '../data/cmdb-data-elastic.mjs'
const elasticFetch = _elasticFetch.default(config)
const dataElastic = _dataElastic.default(config)

let token
function getToken() { //because scripts set the current value on the functions
    return token
}
let userID

const boratMovieID = "tt0443453"

describe('Group tests', function () {

    if(skip) return

    mocha.before((done) => { //https://mochajs.org/#hooks  https://stackoverflow.com/a/30332621
        if(skip) done()
        request(appExpress).post(apiPaths.loginUser).send({ //create user
            name: "ppaulonew33",
            password: "ay",
            api_key: "k_000000"
        }).end(function (err, res){
            token = res.body.token   
            userID = res.body.userID
            done()
        })
    })

    test('Create a group', function () { //https://www.chaijs.com/plugins/chai-http/#:~:text=/%27)-,Setting%20up%20requests,-Once%20a%20request
        const tok = getToken()
        createGroup("myfavms ovies", "of all time").end(function (err, res){
            const id = res.body.id
            expect(id).to.be.a('string')
            expect(res).to.have.status(200)
            elasticFetch.deleteDoc(dataElastic.ourIndexes.groups, id)
        })
    })

    //this didnt work
    /* mocha.before(function(done){ //https://stackoverflow.com/a/12983519
        console.dir("aaaaaaaaaaaaaaaaaa")
        check(done, 1)
    })*/

    test('Add movie to a group', function () { 
        const tok = getToken()
        createGroup("myfavmovies", "of all time").end(function (err, res){
            const groupID = res.body.id
            addMovie(groupID, boratMovieID).end(function (err, res){
                expect(res.body.msg).to.be.a('string').equals("Added movie -> Borat")
                expect(res).to.have.status(200)
                elasticFetch.deleteDoc(dataElastic.ourIndexes.groups, groupID)
            })
        })
    })
    
    test('List all groups of a user', function () {
        const tok = getToken()
        createGroup("myfavmovies", "of all time").end(function (err, res){
            const groupID = res.body.id
            addMovie(groupID, boratMovieID).end(function (err, res){
                request(appExpress).get(apiPaths.getGroupList).set('Authorization', tok).end(function (err, res){
                    const groups = res.body.groups
                    expect(groups).to.be.a('array')
                    expect(groups[0].id).to.be.a('string')
                    expect(groups[0].name).to.be.a('string')
                    expect(res).to.have.status(200)
                    elasticFetch.deleteDoc(dataElastic.ourIndexes.groups, groupID)
                })
            })
        })
    })

    test('Update a group of a user', function () {
        const tok = getToken()
        createGroup("myfavmovies", "of all time").end(function (err, res){
            const groupID = res.body.id
            addMovie(groupID, boratMovieID).end(function (err, res){
                request(appExpress).post(apiPaths.updateGroup.setPath(groupID)).set('Authorization', tok).send({
                    groupName: "watch in 1 year",
                    groupDescription: "zzzzzzzzzzz"
                }).end(function (err, res){
                    expect(res).to.have.status(200)
                    elasticFetch.deleteDoc(dataElastic.ourIndexes.groups, groupID)
                })
            })
        })
    })

    test('Get a group of a user by ID', function () {
        const tok = getToken()
        createGroup("watch later", "no time").end(function (err, res){
            const groupID = res.body.id
            addMovie(groupID, boratMovieID).end(function (err, res){
                request(appExpress).get(apiPaths.getGroup.setPath(groupID)).set('Authorization', tok).end(function (err, res){
                    const obj = res.body.groupObj
                    expect(obj.name).to.be.equal("watch later")
                    expect(obj.description).to.be.equal("no time")
                    expect(obj.movies).to.be.a("array")
                    expect(obj.totalDuration).to.be.a("number")
                    expect(res).to.have.status(200)
                    elasticFetch.deleteDoc(dataElastic.ourIndexes.groups, groupID)
                })
            })
        })
    })

    test('Delete a movie from group', function () {
        const tok = getToken()
        createGroup("myfavmovies", "of all time").end(function (err, res){
            const groupID = res.body.id
            addMovie(groupID, boratMovieID).end(function (err, res){
                request(appExpress).delete(apiPaths.removeMovieFromGroup.setPath(groupID, boratMovieID)).set('Authorization', tok).end(function (err, res){
                    expect(res.body.msg).to.be.a("string")
                    expect(res).to.have.status(200)
                    elasticFetch.deleteDoc(dataElastic.ourIndexes.groups, groupID)
                })
            })
        })
    })

    test('Delete a group of a user', function () {
        const tok = getToken()
        createGroup("myfavmovies", "of all time").end(function (err, res){
            const groupID = res.body.id
            request(appExpress).delete(apiPaths.deleteGroup.setPath(groupID)).set('Authorization', tok).end(function (err, res){
                const msg = res.body.msg
                expect(msg).to.be.a('string')
                expect(msg).to.contain("Deleted")
                console.log(msg)
                expect(res).to.have.status(200)
            }).then(() => {
                request(appExpress).get(apiPaths.getGroup.setPath(groupID)).set('Authorization', tok).end(function (err, res){
                    expect(res).to.have.status(404)
                })
            })
        })
    })

    mocha.after(() =>{
        elasticFetch.deleteDoc(dataElastic.ourIndexes.users, userID)
    })
})


function createGroup(name, description){ //I created groups for each operation because the tests aren't really sequential, although sometimes they end up running sequentially
    const tok = getToken()
    return request(appExpress).post(apiPaths.getGroupList).set('Authorization', tok).send({
        name: name,
        description: description
    })
}

function addMovie(groupID, movieID){
    const tok = getToken()
    return request(appExpress).put(apiPaths.addMovieToGroup.setPath(groupID, movieID)).set('Authorization', tok)
}

function createSomeGroup(){
    const tok = getToken()
    return createGroup("myfavmovies", "of all time").end(function (err, res){
        const groupID = res.body.id
        return addMovie(groupID, boratMovieID)
    })
}
