import * as mocha from 'mocha'; //mocha (test framework)
const assertions = mocha.it

import chai, { expect } from 'chai'//chai (assertion library)


import deepEqualInAnyOrder from 'deep-equal-in-any-order';
chai.use(deepEqualInAnyOrder)

import chaiHttp from 'chai-http';
chai.use(chaiHttp);

import * as server from '../cmdb-server.mjs'
const appExpress = server.app

describe('Main page', function () {
    assertions('Benfica should be in the building', function () {
        chai.request(appExpress).get("/").send().end(function (err, res){
            expect(res.text).to.equal("Benfica in da building")
            expect(res).to.have.status(200)
        })
    })
})

describe('Users', function () {
    let token
    assertions('Create a user', function () {
        chai.request(appExpress).post("/users").send({
            name: "paulonew",
            password: "ay",
            api_key: "k_000000"
        }).end(function (err, res){
            /* console.log(JSON.stringify(res.body)) */
            expect(res.body.token).to.be.a('string')
            token = res.body.token
            expect(res).to.have.status(200)
        })
    })

    assertions('Login user', function () {
        chai.request(appExpress).post("/login").send({
            name: "paulonew",
            password: "ay"
        }).end(function (err, res){
            /* console.log(JSON.stringify(res.body)) */
            expect(res.body.token).to.be.a('string')
            expect(res.body.token).to.equal(token)
            expect(res).to.have.status(200)
        })
    })
})
