import * as errors from './errors-and-codes.mjs'

export function doesBodyContainProps(body, props){ //note/TODO: it doesnt check the type!
    var propsKeys = Object.keys(props)
    let missingProp = undefined
    propsKeys.every(key => {
        if(!body.hasOwnProperty(key)){
            missingProp = key
            return false
        }
        else {
            if(typeof body[key] == 'string'){
                const field = body[key]+""
                if(field.trim().length==0) throw new errors.BadRequest(`Field '${key}' is empty or blank`)
            }
            return true
        }
    })
    if(missingProp) throw new errors.BadRequest(`Missing field -> ${missingProp}`)
}

/**
 * @param {number} totalMinutes 
 * @returns {string} returns like: 2h 45m
 */
export function totalMinutesToHoursAndMinutes(totalMinutes) {
    if(totalMinutes==null) return "A series?"
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours}h ${minutes}m`
}

/**
 * 
 * @param {Array<any>} array 
 * @param {number} index 
 */
export function removeIndex(array, index){
    if(array.length==0) return
    if(index < 0) throw new Error("Invalid index")
    if(index > array.length-1) console.log("Note, the index is greater than the size of the array")
    if(array.length==1) array = []
    else array.splice(index, 1) //or use .filter
    return array
}

export const crypto = await import('node:crypto') //https://nodejs.org/api/crypto.html#crypto

//https://blog.loginradius.com/engineering/password-hashing-with-nodejs/
export function hashPassword(pw){ //https://nodejs.org/api/crypto.html#cryptopbkdf2syncpassword-salt-iterations-keylen-digest     
    const salt = crypto.randomBytes(16).toString('hex')
    const hashedPassword = crypto.pbkdf2Sync(pw, salt,  100, 32, `sha512`).toString(`hex`)
    return {salt, hashedPassword}
}

export function verifyPassword(pw, hashedPassword, usersSalt){
    const hash = crypto.pbkdf2Sync(pw, usersSalt, 100, 32, `sha512`).toString(`hex`)
    return hashedPassword === hash
}

/**
 * @param {string} path
 * @param {string} method Must be "POST", "GET", etc
 * @param {Object} body
 */
 async function fetx(path, method, body){
    return fetch(path, {
        method: method, 
        body : (body || method!="GET" || method!="DELETE") ? JSON.stringify(body) : null ,
        headers: { "Content-Type": "application/json" , "Accept" : "application/json"}
    }).then(rsp => {
        return rsp.json().then(obj => {
            console.log(`Fetch result -> ${JSON.stringify(obj)}`)
            return obj
        }).catch(e => {
            console.log("Error parsing to json -> "+e)
        })
    }).catch(e => {
        console.log("Request error -> "+e)
    })
}