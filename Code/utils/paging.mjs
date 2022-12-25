export function processPaging(skip, limit, listSize){
    const startIndex = skip
    if(limit==0 || listSize==0 || startIndex >= listSize) return null //empty list
    let limitIndex = startIndex + limit-1
    if(limitIndex >= listSize) limitIndex = listSize-1
    return { startIndex, limitIndex }
}