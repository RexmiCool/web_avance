import { loadSync } from "@grpc/proto-loader"
import { loadPackageDefinition } from "@grpc/grpc-js"
import { credentials } from "@grpc/grpc-js";

const PROTO_PATH = "./hello_world.proto";
const packageDefinition = loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const hello_proto = loadPackageDefinition(packageDefinition);

function startClient() {
    const service = new hello_proto.GreeterService(
      "localhost:3000",
      credentials.createInsecure()
    )
    service.SayHello({ name: "Lecteur" }, (error, result) => {
        if (error) {
          console.error("An error has occured", error)
          return
        }
        const { message } = result
        console.log(message)
    })
    service.SayGoodBye({ name: "Lecteur" }, (error, result) => {
        if (error) {
          console.error("An error has occured", error)
          return
        }
        const { message } = result
        console.log(message)
    })
}

startClient()
  