export function doesBodyContainProps(body, props){ //note/TODO: it doesnt check the type!
    var propsKeys = Object.keys(props)
    let missingProp = undefined
    propsKeys.every(key => {
        if(!body.hasOwnProperty(key)){
            missingProp = key
            return false
        }
        else return true
    })
    if(missingProp) throw new utils.BadRequest(`Missing field -> ${missingProp}`)
}
