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
    isPrivate: true
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
    /**
     * @param {string} msg 
     */
    constructor(msg){
        this.msg = msg
    }
}

export class LoginResponse{
    constructor(token, userID){
        this.userID = userID; this.token = token
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
     * @param {string} groupID 
     * @param {string} groupName 
     */
    constructor(groupID, groupName){
        this.groupID = groupID; this.groupName = groupName
    }
}
