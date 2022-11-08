import { constants } from 'node:buffer';

// Our data source / data storage
const crypto = await import('node:crypto');

class Group {
    constructor(name, description, isPrivate){

    }
}

const users = [
    {
        name: 'paulo',
        groups: [],
        token: 'f7c59d82-8a6a-436d-96e0-dd2758a37ab1',
        hash: '7fcd2055b9bb7f567714d426e3e948c0f6bbd906f895d8c72863f7be571ec07d',
        salt: 'b3a8bd6c42ff7c1670fda5f625878f85'
    }
]

export async function createUser(name, password){
    const saltAndHashedPW = hashPassword(password)
    const token = crypto.randomUUID()
    const newUser = {name, groups: [], token, hash: saltAndHashedPW.hashedPassword, salt: saltAndHashedPW.salt}
    console.log("New user -> ", newUser)
    users.push(newUser)
    return token
}

export async function loginUser(name, password){
    const userFound = users.find(user=> { 
        return user.name==name //MUST HAVE RETURN!, unlike kotlin IIRC
    })
    if(userFound==undefined) return undefined
    if(verifyPassword(password, userFound.hash, userFound.salt)) return userFound.token
    return false
}

//Auxiliary functions:
//https://blog.loginradius.com/engineering/password-hashing-with-nodejs/
function hashPassword(pw){ //https://nodejs.org/api/crypto.html#cryptopbkdf2syncpassword-salt-iterations-keylen-digest     
    const salt = crypto.randomBytes(16).toString('hex')
    const hashedPassword = crypto.pbkdf2Sync(pw, salt,  100, 32, `sha512`).toString(`hex`)
    return {salt, hashedPassword}
}

function verifyPassword(pw, hashedPassword, usersSalt){
    const hash = crypto.pbkdf2Sync(pw, usersSalt, 100, 32, `sha512`).toString(`hex`)
    return hashedPassword === hash
}
