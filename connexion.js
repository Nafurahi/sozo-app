// Éléments du DOM
const corps = document.body;
const lampe = document.getElementById('interrupteur');
const sousTitre = document.querySelector('.sous-titre');

// État de la lampe
let estAllumee = false;

// Clic sur la lampe pour allumer / éteindre
lampe.addEventListener('click', () => {
  estAllumee = !estAllumee;
  corps.setAttribute('data-on', estAllumee);

  if (estAllumee) {
    sousTitre.textContent = 'Bienvenue sur Sōzō';
  } else {
    sousTitre.textContent = 'Allumez la lampe pour vous connecter';
  }
});

// Changement du rôle (Lecteur / Auteur)
function choisirRole(role) {
  const tabLecteur = document.getElementById('tab-lecteur');
  const tabAuteur = document.getElementById('tab-auteur');

  if (role === 'lecteur') {
    tabLecteur.classList.add('active');
    tabAuteur.classList.remove('active');
  } else {
    tabAuteur.classList.add('active');
    tabLecteur.classList.remove('active');
  }
}

