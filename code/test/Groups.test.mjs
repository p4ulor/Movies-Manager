let skip = true



import * as mocha from 'mocha' //mocha (test framework)
const test = mocha.it //just for a more clear lexic. To disable all tests, replace 'it' with 'xit' https://stackoverflow.com/a/32724129

import chai, { expect } from 'chai' //chai (assertion library)

import deepEqualInAnyOrder from 'deep-equal-in-any-order'
chai.use(deepEqualInAnyOrder)

import chaiHttp from 'chai-http';
chai.use(chaiHttp);

import * as server from '../cmdb-server.mjs' 
import { apiPaths } from '../web/api/cmdb-web-api.mjs'

console.log("\n---Starting Groups.test---")
const config = new server.ServerConfig(1906, false, "http://localhost:9200")
let appExpress

try {
    appExpress = await server.server(config)
} catch(e){
    console.log("Error:", e.message)
    console.log("Will just skip test")
    skip = true
}

const token = 'Bearer f7c59d82-8a6a-436d-96e0-dd2758a37ab1'

const boratID = "tt0443453" //borat movie

describe('Group tests', function () {
    if(skip) return

    test('Create a group', function () { //https://www.chaijs.com/plugins/chai-http/#:~:text=/%27)-,Setting%20up%20requests,-Once%20a%20request
        createGroup("myfavmovies", "of all time").end(function (err, res){
            const id = res.body.id
            expect(id).to.be.a('string')
            expect(res).to.have.status(200)
        })
    })

    test('Add movie to a group', function () { 
        createGroup("myfavmovies", "of all time").end(function (err, res){
            const groupID = res.body.id
            addMovieToGroup(groupID, boratID).end(function (err, res){
                expect(res.body.msg).to.be.a('string').equals("Added movie -> Borat")
                expect(res).to.have.status(200)
            })
        })
    })

    test('List all groups of a user', function () {
        createGroup("myfavmovies", "of all time").end(function (err, res){
            const groupID = res.body.id
            addMovieToGroup(groupID, boratID).end(function (err, res){
                chai.request(appExpress).get(apiPaths.getGroupList).set('Authorization', token).end(function (err, res){
                    const groups = res.body.groups
                    expect(groups).to.be.a('array')
                    expect(groups[0].id).to.be.a('string')
                    expect(groups[0].name).to.be.a('string')
                    expect(res).to.have.status(200)
                })
            })
        })
    })

    test('Update a group of a user', function () {
        createGroup("myfavmovies", "of all time").end(function (err, res){
            const groupID = res.body.id
            addMovieToGroup(groupID, boratID).end(function (err, res){
                chai.request(appExpress).post(apiPaths.updateGroup.setPath(groupID)).set('Authorization', token).send({
                    groupName: "watch in 1 year",
                    groupDescription: "zzzzzzzzzzz"
                }).end(function (err, res){
                    expect(res).to.have.status(200)
                })
            })
        })
    })

    test('Get a group of a user by ID', function () {
        //rollback:
        createGroup("watch later", "no time").end(function (err, res){
            const groupID = res.body.id
            addMovieToGroup(groupID, boratID).end(function (err, res){
                chai.request(appExpress).get(apiPaths.getGroup.setPath(groupID)).set('Authorization', token).end(function (err, res){
                    const obj = res.body.groupObj
                    expect(obj.name).to.be.equal("watch later")
                    expect(obj.description).to.be.equal("no time")
                    expect(obj.movies).to.be.a("array")
                    expect(obj.totalDuration).to.be.a("number")
                    expect(res).to.have.status(200)
                })
            })
        })
    })

    test('Delete a movie from group', function () {
        createGroup("myfavmovies", "of all time").end(function (err, res){
            const groupID = res.body.id
            addMovieToGroup(groupID, boratID).end(function (err, res){
                chai.request(appExpress).delete(apiPaths.removeMovieFromGroup.setPath(groupID)).set('Authorization', token).end(function (err, res){
                    expect(res.body.msg).to.be.a("string")
                    expect(res).to.have.status(200)
                })
            })
        })
    })

    test('Delete a group of a user', function () {
        createGroup("myfavmovies", "of all time").end(function (err, res){
            const groupID = res.body.id
            chai.request(appExpress).delete(apiPaths.deleteGroup.setPath(groupID)).set('Authorization', token).end(function (err, res){
                const msg = res.body.msg
                expect(msg).to.be.a('string')
                expect(msg).to.contain("Deleted")
                console.log(msg)
                expect(res).to.have.status(200)
            }).then(() => {
                chai.request(appExpress).get(apiPaths.getGroup.setPath(groupID)).set('Authorization', token).end(function (err, res){
                    expect(res).to.have.status(404)
                })
            })
        })
    })
})

//Make sure the correct HTTP method is called for the endpoint (.post()) when using chai, or the test fails for bad request
function createGroup(name, description){ //I created groups for each operation because the tests aren't really sequential, although sometimes they end up running sequentially https://stackoverflow.com/a/12983519
    return chai.request(appExpress).post(apiPaths.createGroup).set('Authorization', token).send({
        name: name,
        description: description
    })
}

function addMovieToGroup(groupID, movieID) {
    return chai.request(appExpress).post(apiPaths.addMovieToGroup.setPath(groupID, movieID)).set('Authorization', token)
}

function createSomeGroup(){
    return createGroup("myfavmovies", "of all time").end(function (err, res){
        const groupID = res.body.id
        return addMovieToGroup(groupID, boratID)
    })
}