import * as mocha from 'mocha'; //mocha (test framework)
const assertions = mocha.it

import chai, { expect } from 'chai'//chai (assertion library)


import deepEqualInAnyOrder from 'deep-equal-in-any-order';
chai.use(deepEqualInAnyOrder)

import chaiHttp from 'chai-http';
chai.use(chaiHttp);

import * as server from '../cmdb-server.mjs'
const appExpress = server.app

describe('Users', function () {
    const token = 'Bearer f7c59d82-8a6a-436d-96e0-dd2758a37ab1'

    assertions('Get top 5 movies', function () {
        chai.request(appExpress).get("/movies?top=5").set('Authorization', token).end(function (err, res){
            const top = res.body.top
            expect(top).to.be.a('array').lengthOf(5)
            console.log("top 5 movies ->"+JSON.stringify(top))
            expect(res).to.have.status(200)
        })
    })

    assertions('Search movies w/ "the " limit 5', function () {
        chai.request(appExpress).get("/movies/the%20?limit=5").set('Authorization', token).end(function (err, res){
            const found = res.body.found
            expect(found).to.be.a('array').lengthOf(5)
            expect(found[0].title).to.contain("the")
            console.log("found titles -> "+found[0].title)
            expect(res).to.have.status(200)
        })
    })
})
