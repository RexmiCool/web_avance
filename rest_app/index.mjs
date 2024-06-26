import Keycloak from 'keycloak-connect';
import axios from 'axios';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import express from 'express';
import flies from './flies.json' assert { type: 'json' };
import authClient from './client_secret.json' assert { type: 'json' };

import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { loadSync } from "@grpc/proto-loader"
import { loadPackageDefinition } from "@grpc/grpc-js"
import { credentials } from "@grpc/grpc-js";

const GOOGLE_CLIENT_ID = authClient.web.client_id;
const GOOGLE_CLIENT_SECRET = authClient.web.client_secret;
const CALLBACK_URL = 'http://localhost:8080/auth/google/callback';
const PORT = 8080;

const PROTO_PATH = "hello_world.proto";
const packageDefinition = loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const proto = loadPackageDefinition(packageDefinition);

const service = new proto.HotelService("address_arpc:3000", credentials.createInsecure())

const app = express()

app.use(express.json());
const corsOptions = {
    origin: 'http://localhost:8081',
    credentials: true,
};

app.use(cookieParser());
app.use(cors(corsOptions));

const memoryStore = new session.MemoryStore();
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    store: memoryStore
}));

const keycloak = new Keycloak({
    store: memoryStore
});

app.use(
    keycloak.middleware({
        logout: '/logout',
        admin: '/'
    })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static('js_app'));

app.listen(PORT, () => {
    console.log("Serveur à l'écoute")
})

// Passport configuration
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    profile.accessToken = accessToken;
    done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

//-------------------------------------------------------------------------- Routes google
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email', 'https://www.googleapis.com/auth/contacts.readonly'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        const accessToken = req.user.accessToken;
        res.cookie('accessToken', accessToken, { httpOnly: true, secure: true });
        res.redirect(`http://localhost:8081`);
    }
);

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Error during logout:', err);
            return res.status(500).json({ message: 'Error during logout' });
        }
        res.clearCookie('accessToken');
        res.redirect(`http://localhost:8081`);
    });
});

app.get('/profile', async (req, res) => {
    const accessToken = req.cookies.accessToken;
    console.log(accessToken)
    if (accessToken) {
        const response = await axios.get('https://people.googleapis.com/v1/people/me', {
            params: {
                personFields: 'names,emailAddresses,photos,ageRanges,locales,phoneNumbers'
            },
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const userProfile = {
            displayName: response.data.names[0].displayName,
            email: response.data.emailAddresses[0].value,
            photoUrl: response.data.photos[0].url
        };

        res.json(userProfile);
    } else {
        res.status(401).json({ message: 'User not authenticated' });
    }
});

//-------------------------------------------------------------------------- REST fly
app.get('/fly', keycloak.protect('realm:user'), (req, res) => { res.status(200).json(flies) });
app.get('/fly/:id', keycloak.protect(), (req, res) => {
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
