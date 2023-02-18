import { server } from "./cmdb-server.mjs"

export const application = server(1904, false, "http://localhost:9200")
