export const statusCodes = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500
}

export class BadRequest extends Error {
    constructor(message) { super(message)
        this.code = statusCodes.BAD_REQUEST
    }
}

export class NotFound extends Error {
    constructor(message) { super(message)
        this.code = statusCodes.NOT_FOUND
    }
}

export class Forbidden extends Error {
    constructor(message) { super(message)
        this.code = statusCodes.FORBIDDEN
    }
}

export class Unauthorized extends Error {
    constructor(message) { super(message)
        this.code = statusCodes.UNAUTHORIZED
    }
}

export class Conflict extends Error {
    constructor(message) { super(message)
        this.code = statusCodes.CONFLICT
    }
}

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

export const generalServerResponse = {
    msg: ""
}