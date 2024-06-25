import { google } from 'googleapis';
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

const service = new proto.HotelService("localhost:3000", credentials.createInsecure())

const app = express()

app.use(express.json());
app.use(cors());
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
}));
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
    callbackURL: CALLBACK_URL,
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/userinfo.email'],
    passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
    req.session.accessToken = accessToken;
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const people = google.people({ version: 'v1', auth: oauth2Client });
    try {
        const me = await people.people.get({
            resourceName: 'people/me',
            personFields: 'names,emailAddresses,photos',
        });
        const userProfile = {
            id: profile.id,
            displayName: profile.displayName,
            emails: profile.emails,
            photos: profile.photos,
            profile: me.data
        };
        done(null, userProfile);
    } catch (error) {
        done(error, null);
    }
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
        res.redirect('http://127.0.0.1:5500/js_app/index.html'); 
    }
);

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

app.get('/profile', (req, res) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.status(401).json({ message: 'User not authenticated' });
    }
});

//-------------------------------------------------------------------------- REST fly
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
