const isDataElasticSearch = true


import * as mocha from 'mocha' //mocha (test framework)
const assertion = mocha.it //just for a more clear lexic. To disable all tests, replace 'it' with 'xit' https://stackoverflow.com/a/32724129

import chai, { expect } from 'chai' //chai (assertion library)

import deepEqualInAnyOrder from 'deep-equal-in-any-order'
chai.use(deepEqualInAnyOrder)

import chaiHttp from 'chai-http'
chai.use(chaiHttp)

import * as server from '../cmdb-server.mjs'
const appExpress/*: Express */ = server.server(1905, isDataElasticSearch, "http://localhost:9200")
const api = server.apiPath

import * as elasticFetch from '../utils/elastic-fetch.mjs'
import * as dataElastic from '../data/cmdb-data-elastic.mjs'

describe('Main page', function () {
    assertion('Should get .html', function () {
        chai.request(appExpress).get("/").send().end(function (err, res){
            expect(res.get("Content-Type")).to.include("text/html") // or use res.header.content-type=="text/html" https://stackoverflow.com/a/30302180/9375488
            expect(res).to.have.status(200)
        })
    })
})

describe('Users', function () {

    assertion('Create a user', function () {
        chai.request(appExpress).post(api+"/users").send({
            name: "paulonew",
            password: "ay",
            api_key: "k_000000"
        }).end(function (err, res){
            console.log(JSON.stringify(res.body))
            expect(res.body.token).to.be.a('string')
            expect(res).to.have.status(200)
            if(isDataElasticSearch) elasticFetch.deleteDoc(dataElastic.ourIndexes.users, res.body.userID)
        })
    })

    assertion('Login user', function () {
        let token
        let id
        chai.request(appExpress).post(api+"/users").send({
            name: "paulonew",
            password: "ay",
            api_key: "k_000000"
        }).end(function (err, resp){

            token = resp.body.token
            id = resp.body.userID

            chai.request(appExpress).post(api+"/login").send({
                name: "paulonew",
                password: "ay"
            }).end(function (err, res){
                // console.log(JSON.stringify(res.body))
                expect(res.body.token).to.be.a('string')
                expect(res.body.token).to.equal(token)
                expect(res).to.have.status(200)
                if(isDataElasticSearch) elasticFetch.deleteDoc(dataElastic.ourIndexes.users, id)
            })
        })
    })
}) 

