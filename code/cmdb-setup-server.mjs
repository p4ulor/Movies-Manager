import { server, ServerConfig } from "./cmdb-server.mjs"

try {
    await server(new ServerConfig(1904, false, "http://localhost:9200"))
} catch(e) {
    console.log("Error:", e)
    process.exit()
}

console.log("Server setup finished")
