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

/**
 * @param {number} totalMinutes 
 * @returns {string} returns something like: 2h 45m
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
