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

const rooms = [
  {
    name: "Grand Hotel Montmartre",
    location: "Paris",
    price: 345,
    standing: "haut de gamme"
  },
  {
    name: "Club med paella",
    location: "Espana",
    price: 189,
    standing: "middle gamme"
  },
  {
    name: "Hotel F1 ales plage(supplément rats)",
    location: "Ales",
    price: 37,
    standing: "bas de gamme"
  }
]

const GetRoom = (call, callback) => {
  // Sélectionner un index aléatoire
  const randomIndex = Math.floor(Math.random() * rooms.length);
  const room = rooms[randomIndex];

  callback(null, room)
}

function nombreDeNuits(dateDebut, dateFin) {
  // Convertir les chaînes de caractères en objets Date
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);

  // Calculer la différence en millisecondes
  const differenceEnMillis = fin - debut;

  // Convertir la différence en jours
  const differenceEnJours = differenceEnMillis / (1000 * 60 * 60 * 24);

  return differenceEnJours;
}

const ReservRoom = (call, callback) => {
  const { hotelname, fullname, startdate, enddate } = call.request
  //const room = rooms.find(r => r.name === hotelname);
  const room = {
    name: "Grand Hotel Montmartre",
    location: "Paris",
    price: 345,
    standing: "haut de gamme"
  }
  const daysNumber = nombreDeNuits(startdate, enddate)
  const daysNumberPrice = daysNumber * room.price
  const message = `Vous, ${fullname}, avez réservé une chambre à l'hotel ${room.name}, du ${startdate} au ${enddate} (${daysNumber} jours), au prix de ${daysNumberPrice}€.\n`
  callback(null, {message})
}

function startServer() {
  const server = new Server()
  server.addService(hello_proto.HotelService.service, { GetRoom: GetRoom, ReservRoom: ReservRoom })
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
