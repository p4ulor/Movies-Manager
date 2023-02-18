import * as mocha from 'mocha' //mocha (test framework)
const assertion = mocha.xit //just for a more clear lexic. To disable all tests, replace 'it' with 'xit' https://stackoverflow.com/a/32724129

import chai, { expect } from 'chai' //chai (assertion library)


import deepEqualInAnyOrder from 'deep-equal-in-any-order';
chai.use(deepEqualInAnyOrder)

import chaiHttp from 'chai-http';
chai.use(chaiHttp);

import * as server from '../cmdb-server.mjs'
const appExpress = server.server(1907, false, "http://localhost:9200")
const api = server.apiPath

describe('Users', function () {
    const token = 'Bearer f7c59d82-8a6a-436d-96e0-dd2758a37ab1'

    assertion('Get top 5 movies', function () {
        chai.request(appExpress).get(api+"/movies/top?top=5").set('Authorization', token).end(function (err, res){
            const top = res.body.top
            expect(top).to.be.a('array').lengthOf(5)
            console.log("top 5 movies ->"+JSON.stringify(top))
            expect(res).to.have.status(200)
        })
    })

    assertion('Search movies w/ "the " limit 5', function () {
        chai.request(appExpress).get(api+"/movies/search?searchTerms=the&limit=10").set('Authorization', token).end(function (err, res){
            const found = res.body.found
            expect(found).to.be.a('array').lengthOf(10)
            expect(found[0].title.toLowerCase()).to.contain("the")
            expect(found[0].id).to.be.a("string")
            console.log("found titles -> "+JSON.stringify(found))

            expect(res).to.have.status(200)
        })
    })

    assertion('Get movie tt0118715', function () {
        chai.request(appExpress).get(api+"/movies/tt0118715").set('Authorization', token).end(function (err, res){
            const id = res.body.id
            expect(id).to.be.a('string')
            
            const movieName = res.body.movieObj.name
            expect(movieName).to.equal("The Big Lebowski")

            expect(res).to.have.status(200)
        })
    })

    assertion('Get the actor that plays the character Rambo', function () {
        chai.request(appExpress).get(api+"/actor/nm0000230").set('Authorization', token).end(function (err, res){
            const id = res.body.id
            expect(id).to.be.a('string')
            
            const actorName = res.body.actorObj.name
            expect(actorName).to.equal("Sylvester Stallone")

            expect(res).to.have.status(200)
        })
    })
})
