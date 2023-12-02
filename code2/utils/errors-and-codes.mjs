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
        this.name = BadRequest.name
    }
}

export class NotFound extends Error {
    constructor(message) { super(message)
        this.code = statusCodes.NOT_FOUND
        this.name = NotFound.name
    }
}

export class Forbidden extends Error {
    constructor(message) { super(message)
        this.code = statusCodes.FORBIDDEN
        this.name = Forbidden.name
    }
}

export class Unauthorized extends Error {
    constructor(message) { super(message)
        this.code = statusCodes.UNAUTHORIZED
        this.name = Unauthorized.name
    }
}

export class Conflict extends Error {
    constructor(message) { super(message)
        this.code = statusCodes.CONFLICT
        this.name = Conflict.name
    }
}

export class ServerError extends Error {
    constructor(message) { super(message)
        this.code = statusCodes.INTERNAL_SERVER_ERROR
        this.name = ServerError.name
    }
}
