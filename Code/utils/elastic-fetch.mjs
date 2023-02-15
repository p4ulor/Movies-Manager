import { ELASTIC_SEARCH_URL } from "../cmdb-server.mjs"
import fetch from "node-fetch"

export async function doesIndexExist(indexName){
    const uri = doesIndexExistUri(indexName)
    return await fetch(uri, {method: "HEAD"}).then(response => 
        response.ok
    )
}

export async function createIndex(indexName){
    const uri = createIndexUri(indexName)
    easyFetch(uri, "PUT")
}

export async function getDoc(index, id){
    const uri = getDocUri(index, id)
    return easyFetch(uri)
}

/**
 * @param {string} index Unique index identifier (entity, like "users", "movies", "actors" etc)
 * @param {string} field the name of the field
 * @param {Object} value
 */
export async function searchDoc(index, field, value){
    const uri = searchDocUri(index, field, value)
    return easyFetch(uri)
}

/**
 * @param {string} index Unique index identifier (entity, like "users", "movies", "actors" etc)
 * @param {string} id the identifier of the entity
 * @param {Object} body an objected with a consistent structure for that index
 */
export async function updateDoc(index, id, body) {
    const uri = updateDocUri(index, id)
    return easyFetch(uri, "POST", updateBody(body))
}

export async function createDoc(index, body) {
    const uri = createDocUri(index)
    return easyFetch(uri, "POST", body)
}

export async function createDocWithID(index, body, id) {
    const uri = createDocWithIDUri(index, id)
    return easyFetch(uri, "POST", body)
}

export async function deleteDoc(index, id){
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

const doesIndexExistUri = (index) => `${ELASTIC_SEARCH_URL}/${index}`
const searchDocUri = (index, field, value) => `${ELASTIC_SEARCH_URL}/${index}/_search?q=${field}:${value}` 
const getDocUri = (index, id) => `${ELASTIC_SEARCH_URL}/${index}/_doc/${id}`
const createDocUri = (index) => `${ELASTIC_SEARCH_URL}/${index}/_doc/?refresh=wait_for`
const createDocWithIDUri = (index, id) => `${ELASTIC_SEARCH_URL}/${index}/_doc/${id}?refresh=wait_for`
const createIndexUri = (index) => `${ELASTIC_SEARCH_URL}/${index}`
const updateDocUri = (index, id) => `${ELASTIC_SEARCH_URL}/${index}/_update/${id}?refresh=wait_for`
const deleteDocUri = (index, id) => `${ELASTIC_SEARCH_URL}/${index}/_doc/${id}?refresh=wait_for`

const updateBody = (body) => { return {doc: body}}