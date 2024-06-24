import { loadSync } from '@grpc/proto-loader'
import {
    loadPackageDefinition,
    Server,
    ServerCredentials,
  } from "@grpc/grpc-js"
  
const PROTO_PATH = './hello_world.proto'

const packageDefinition = loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
})

const hello_proto = loadPackageDefinition(packageDefinition)

const sayHello = (call, callback) => {
  const { name } = call.request
  callback(null, { message: `Bonjour ${name}` })
}

const sayGoodBye = (call, callback) => {
    const { name } = call.request
    callback(null, { message: `GoogBye ${name}` })
  }

function startServer() {  
    const server = new Server()
    server.addService(hello_proto.GreeterService.service, { sayHello, sayGoodBye })
    const PORT = 3000
    const host = `localhost:${PORT}`
    server.bindAsync(host, ServerCredentials.createInsecure(), (error) => {
      if (error) {
        console.log("An error has occurred in bindAsync", error)
        return
      }
      //server.start()
      console.log(`Server listening on: ${host}`)
    })
}

startServer()
