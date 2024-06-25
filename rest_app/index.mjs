import { loadSync } from "@grpc/proto-loader"
import { loadPackageDefinition } from "@grpc/grpc-js"
import { credentials } from "@grpc/grpc-js";

const PROTO_PATH = "../grpc_app/hello_world.proto";
const packageDefinition = loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const proto = loadPackageDefinition(packageDefinition);

const service = new proto.HotelService("localhost:3000", credentials.createInsecure())

//REST
import express from 'express';
import flies from './flies.json' assert { type: 'json' };
const app = express()

app.use(express.json());
app.listen(8080, () => { console.log("Serveur à l'écoute") })

app.get('/fly', (req, res) => { res.status(200).json(flies) });
app.get('/fly/:id', (req, res) => {
    const flightId = parseInt(req.params.id);
    const flight = flies.find(fly => fly.id === flightId);
    let message = `Votre vol ${flight.fly_number} avec la compagnie ${flight.company} a été réservé pour le ${flight.date} sur le siege ${flight.seat} pour ${flight.price}€.\n`

    if (!flight) {
        return res.status(404).json({ message: 'Vol non trouvé' });
    }

    service.GetRoom({}, (error, room) => {
        if (error) {
            console.error('Erreur lors de la récupération des informations de l\'hôtel', error);
            return res.status(500).json({ message: 'Erreur lors de la récupération des informations de l\'hôtel' });
        }

        service.ReservRoom({
            hotelname: room.name,
            fullname: "Matthieu JEAN",
            startdate: "2024/06/29",
            enddate: "2024/07/03"
        }, (error, reservResponse) => {
            if (error) {
                console.error('Erreur lors de la réservation de la chambre d\'hôtel', err);
                return res.status(500).json({ message: 'Erreur lors de la réservation de la chambre d\'hôtel' });
            }
            message = reservResponse.message + message;
            res.status(200).json(message);
        })
    })
});

app.post('/fly', (req, res) => {
    const newFly = req.body;
    newFly.id = flies.length ? flies[flies.length - 1].id + 1 : 1;
    flies.push(newFly);
    res.status(201).json(newFly);
});

app.delete('/fly/:id', (req, res) => {
    const id = parseInt(req.params.id)
    let flyvar = flies.find(flyvar => flyvar.id === id)
    flies.splice(flies.indexOf(flyvar), 1)
    res.status(200).json(flies)
});

app.get('/auth', (req, res) => {
    


});
