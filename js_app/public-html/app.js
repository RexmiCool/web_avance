document.addEventListener('DOMContentLoaded', () => {
    const keycloak = new Keycloak({
        url: 'http://localhost:8085/',
        realm: 'WebServices',
        clientId: 'web-client'
    });

    keycloak.init({ onLoad: 'login-required' }).then(authenticated => {
        if (authenticated) {
            // Afficher les informations utilisateur
            const userProfile = document.getElementById('userProfile');
            keycloak.loadUserProfile().then(profile => {
                userProfile.innerHTML = `
                    <h2>Profil utilisateur</h2>
                    <div>
                        <p>Nom complet : ${profile.firstName} ${profile.lastName}</p>
                        <p>Email : ${profile.email}</p>
                    </div>
                    <button onclick="keycloak.logout()">Se déconnecter</button>
                `;
            });

            // Gérer le formulaire de réservation
            document.getElementById('reservationForm').addEventListener('submit', function (event) {
                event.preventDefault();
                const flightId = document.getElementById('flightId').value;

                fetch(`http://localhost:8080/fly/${flightId}`, {
                    headers: {
                        'Authorization': `Bearer ${keycloak.token}`
                    }
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Vol non trouvé');
                        }
                        return response.json();
                    })
                    .then(data => {
                        document.getElementById('result').textContent = data;
                    })
                    .catch(error => {
                        document.getElementById('result').textContent = error.message;
                    });
            });
        } else {
            document.getElementById('loginBtn').addEventListener('click', () => {
                keycloak.login();
            });
        }
    }).catch(() => {
        console.log('Erreur lors de l\'initialisation de Keycloak');
    });
});
