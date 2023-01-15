/**
 * This will reduce client-side repetitive code 
 * @param {string} path
 * @param {string} method Must be "POST", "GET", etc
 * @param {Object} body
 * @return {Promise<object | null} returns null on error
 */
async function fetx(path, method, body){
    const options = {
        method: method, 
        credentials: 'same-origin',
        body: (body || method!="GET" || method!="DELETE") ? JSON.stringify(body) : null,
        headers: { "Content-Type": "application/json" , "Accept" : "application/json"}
    }

    return fetch(path, options).then(async rsp => {
        if(!rsp.ok){
            rsp.json().then(message => {
                alert(`Error: ${rsp.statusText}. ${message.error}`)
                //window.location=`/error?type=${response.statusText}` //omg I was using window.location.pathname and it was converting ? to %3F... https://stackoverflow.com/a/26377931/9375488
            })
            return null
        }

        try {
            const obj = await rsp.json()
            console.log(`Fetch JSON response -> ${JSON.stringify(obj)}`)
            return obj
        } catch (e) {
            console.log("Error parsing to json -> " + e)
            return null
        }
    }).catch(e => {
        console.log("Request error -> "+e)
        return null
    })
}

function wassupWorld(){
    console.log("wassup")
}