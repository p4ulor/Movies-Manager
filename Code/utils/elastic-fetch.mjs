import { ELASTIC_SEARCH } from "../cmdb-server.mjs"
import fetch from "node-fetch"

export async function createIndex(indexName){
    const uri = createIndexUri(indexName)
    easyFetch(uri, "PUT")
}

/**
 * @param {string} index Unique index identifier (entity, like users, movies, actors etc)
 * @param {string} id the identifier of the entity
 */
export async function get(index, id){
    const uri = getDocUri(index, id)
    return easyFetch(uri)
}

export async function search(index, field, value){
    const uri = searchDocUri(index, field, value)
    return easyFetch(uri)
}

/**
 * @param {string} index Unique index identifier (entity, like users, movies, actors etc)
 * @param {string} id the identifier of the entity
 * @param {Object} body the new data
 */
export async function update(index, id, body) {
    const uri = updateDocUri(index, id)
    return easyFetch(uri, "POST", updateBody(body))
}

/**
 * @param {string} index Unique index identifier (entity, like users, movies, actors etc)
 * @param {Object} body the new data
 */
export async function create(index, body) {
    const uri = createDocUri(index)
    return easyFetch(uri, "POST", body)
}

/**
 * @param {string} index Unique index identifier (entity, like users, movies, actors etc)
 * @param {string} id the identifier of the entity
 */
export async function delite(index, id){ //because delete is a reserved word
    const uri = deleteDocUri(index, id)
    return easyFetch(uri, "DELETE")
}

/**
 * @param {string} uri 
 * @param {string} method must be like "POST", "GET" etc
 * @param {Object} body 
 * @returns {Promise<any>}
 */
async function easyFetch(uri, method, body = undefined) {
    const options = {}
    if (body) {
        options.headers = {
            'Content-Type': 'application/json'
        }
        options.body= JSON.stringify(body)
    }
    options.method = method

    return fetch(uri, options).then(response => 
        response.json()
    )
}

const searchDocUri = (index, field, value) => `${ELASTIC_SEARCH}/${index}/_search?q=${field}:${value}` 
const getDocUri = (index, id) => `${ELASTIC_SEARCH}/${index}/_doc/${id}`
const createDocUri = (index) => `${ELASTIC_SEARCH}/${index}/_doc/?refresh=wait_for`
const createIndexUri = (index) => `${ELASTIC_SEARCH}/${index}`
const updateDocUri = (index, id) => `${ELASTIC_SEARCH}/${index}/_update/${id}`
const deleteDocUri = (index, id) => `${ELASTIC_SEARCH}/${index}/_doc/${id}?refresh=wait_for`

const updateBody = (body) => { return {doc: body}}