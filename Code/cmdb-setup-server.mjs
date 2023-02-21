import { server, ServerConfig } from "./cmdb-server.mjs"

export const application = server(new ServerConfig(1904, true, "http://localhost:9200"))

console.log("Server setup finished")
