export const statusCodes = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNATHORIZED: 401,
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

export class Unathorized extends Error {
    constructor(message) { super(message)
        this.code = statusCodes.UNATHORIZED
    }
}

export const newUserRequest = {
    name: "",
    password: ""
}

export const newGroupRequest = {
    name: "",
    description: "",
    isPrivate: true
}