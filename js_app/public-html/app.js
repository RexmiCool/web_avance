document.getElementById('loginBtn').addEventListener('click', () => {
    window.location.href = 'http://localhost:8080/auth/google';
});

document.getElementById('reservationForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const flightId = document.getElementById('flightId').value;

    fetch(`http://localhost:8080/fly/${flightId}`)
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

document.addEventListener('DOMContentLoaded', () => {
    // Vérification de l'état d'authentification lors du chargement de la page
    fetch('http://localhost:8080/profile', { credentials: 'include' })
        .then(response => {
            if (response.status === 401) {
                throw new Error('User not authenticated');
            }
            return response.json();
        })
        .then(user => {
            // Affichage des informations de profil de l'utilisateur
            const userProfile = document.getElementById('userProfile');
            userProfile.innerHTML = `
                <h2>Profil utilisateur</h2>
                <p>Nom complet : ${user.displayName}</p>
                <p>Email : ${user.email}</p>
                <img src="${user.photoUrl}" alt="Photo de profil">
                <a href="http://localhost:8080/logout">Se déconnecter</a>
            `;
        })
        .catch(error => {
            console.error('Erreur lors de la récupération du profil utilisateur :', error.message);
        });
});