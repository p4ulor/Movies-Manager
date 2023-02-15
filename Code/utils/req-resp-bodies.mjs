//Expected Request bodies

export const newUserRequest = {
    name: "",
    password: "",
    api_key: ""
}

export const UserLoginRequest = {
    name: "",
    password: "",
}

export const newGroupRequest = {
    name: "",
    description: "",
    //isPrivate: true
}

export const updateGroupRequest = {
    groupName: "",
    groupDescription: ""
}

// Server response bodies


export const imdb_API_KeyInvalid = {
    errorMessage: "Invalid API Key"
}

export class GeneralServerResponse {
    /** @param {string} msg */
    constructor(msg){
        this.msg = msg
    }
}

export class LoginResponse{
    constructor(token, userID){
        this.userID = userID; this.token = token
    }
}

export class GroupCreatedResponse{
    /** @param {string | number} id */
    constructor(id){
        this.id = id.toString()
    }
}

export class GroupsListResponse {
    /**
     * @param {Array<GroupsItemListResponse>} groups 
     */
    constructor(groups){
        this.groups = groups
    }
}

export class GroupsItemListResponse {
    /**
     * @param {string} id 
     * @param {string} name 
     */
    constructor(id, name){
        this.id = id; this.name = name
    }
}
