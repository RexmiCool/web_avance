document.addEventListener('DOMContentLoaded', () => {

    // Configuration de Keycloak
    const keycloakConfig = {
        url: 'http://localhost:8085/',
        realm: 'WebServices',
        clientId: '1234'
    };


    const keycloak = new Keycloak(keycloakConfig);

    // Initialisation de Keycloak
    keycloak.init({
        onLoad: 'login-required'
    });/*.then(authenticated => {
        if (authenticated) {
            console.log('Utilisateur authentifié');
            updateUserProfile();
        } else {
            console.log('Utilisateur non authentifié');
        }
    }).catch(error => {
        console.error('Erreur d\'initialisation de Keycloak', error);
    });*/

    document.getElementById('loginBtn').addEventListener('click', () => {
        keycloak.login();
    });

    document.getElementById('reservationForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const flightId = document.getElementById('flightId').value;

        fetch(`http://localhost:8080/fly/${flightId}`, {
            method: 'GET',
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
                document.getElementById('result').textContent = JSON.stringify(data);
            })
            .catch(error => {
                document.getElementById('result').textContent = error.message;
            });
    });

    function updateUserProfile() {
        const userProfile = document.getElementById('userProfile');
        userProfile.innerHTML = `
            <h2>Profil utilisateur</h2>
            <div>
                <p>Nom complet : ${keycloak.tokenParsed.name}</p>
                <p>Email : ${keycloak.tokenParsed.email}</p>
            </div>
            <button id="logoutBtn">Se déconnecter</button>
        `;

        document.getElementById('logoutBtn').addEventListener('click', () => {
            keycloak.logout();
        });
    }
});
