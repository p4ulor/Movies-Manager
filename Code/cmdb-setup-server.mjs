import { server, ServerConfig } from "./cmdb-server.mjs"

const application = server(new ServerConfig(1904, false, "http://localhost:9200"))

application.catch((e) => {
    console.log("Error:", e)
    process.exit()
})

console.log("Server setup finished")
