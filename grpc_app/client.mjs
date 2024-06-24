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
  const service = new hello_proto.HotelService(
    "localhost:3000",
    credentials.createInsecure()
  )

  let roomName
  service.GetRoom({}, (error, result) => {
    if (error) {
      console.error("An error has occured", error)
      return
    }
    roomName = result.name
    console.log(result)
  })


  service.ReservRoom({ hotelname: roomName, fullname: "Matthieu JEAN", startdate: "2024/06/29", enddate: "2024/07/03" }, (error, result) => {
    if (error) {
      console.error("An error has occured", error)
      return
    }
    console.log(result)
  })
}

startClient()
