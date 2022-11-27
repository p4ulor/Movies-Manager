import * as mocha from 'mocha'; //mocha (test framework)
const assertions = mocha.it

import chai, { expect } from 'chai'//chai (assertion library)


import deepEqualInAnyOrder from 'deep-equal-in-any-order';
chai.use(deepEqualInAnyOrder)

import chaiHttp from 'chai-http';
chai.use(chaiHttp);

import * as server from '../cmdb-server.mjs'
const appExpress = server.app

describe('Group tests', function () {

    const token = 'Bearer f7c59d82-8a6a-436d-96e0-dd2758a37ab1'

    assertions('Create a group', function () { //https://www.chaijs.com/plugins/chai-http/#:~:text=/%27)-,Setting%20up%20requests,-Once%20a%20request
        chai.request(appExpress).post("/groups").set('Authorization', token).send({
            name: "myfavmovies",
            description: "of all time",
            isPrivate: true
        }).end(function (err, res){
            expect(res.body.id).to.be.a('number').equals(2)
            expect(res).to.have.status(200)
        })
    })

    assertions('Add movie to a group', function () { //tt0443453 is borat
        chai.request(appExpress).put("/groups/1/tt0443453").set('Authorization', token).send({
            id: "tt0443453"
        }).end(function (err, res){
            expect(res.body.msg).to.be.a('string').equals("Added movie -> Borat")
            expect(res).to.have.status(200)
        })
    })

    assertions('List all movies of a group', function () {
        chai.request(appExpress).get("/groups").set('Authorization', token).end(function (err, res){
            expect(res.body).to.be.a('array')
            expect(res.body[0].id).to.be.a('number')
            expect(res.body[0].name).to.be.a('string')
            expect(res).to.have.status(200)
        })
    })

    assertions('Delete a group of a user', function () {
        chai.request(appExpress).delete("/groups/0").set('Authorization', token).end(function (err, res){
            const msg = res.body.msg
            expect(msg).to.be.a('string')
            console.log(msg)
            expect(res).to.have.status(200)
        })
    })

    assertions('Update a group of a user', function () {
        chai.request(appExpress).post("/groups/1").set('Authorization', token).send({
            groupName: "watch in 1 year",
            groupDescription: "zzzzzzzzzzz"
        }).end(function (err, res){
            const body = res.body
            expect(body.name).to.be.equal("watch in 1 year")
            expect(body.description).to.be.equal("zzzzzzzzzzz")
            expect(res).to.have.status(200)
        })

        
    })

    assertions('Get a group of a user by ID', function () {
        //rollback:
        chai.request(appExpress).post("/groups/1").set('Authorization', token).send({
            groupName: "watch later",
            groupDescription: "no time"
        }).then(() => {
            chai.request(appExpress).get("/groups/1").set('Authorization', token).end(function (err, res){
                const body = res.body
                expect(body.name).to.be.equal("watch later")
                expect(body.description).to.be.equal("no time")
                expect(body.movies).to.be.a("array")
                expect(body.totalDuration).to.be.a("number")
                expect(res).to.have.status(200)
            })
        })
    })

    assertions('Delete a movie from group', function () {
        chai.request(appExpress).delete("/groups/1/tt0110912").set('Authorization', token).end(function (err, res){
            expect(res.body.msg).to.be.a("string")
            expect(res).to.have.status(200)
        })
    })
})
