// Bascule entre l'espace Lecteur et l'espace Auteur
function changerOnglet(nomEspace) {
  const vueLecteur = document.getElementById('espace-lecteur');
  const vueAuteur = document.getElementById('espace-auteur');
  const onglets = document.querySelectorAll('.onglet');

  onglets.forEach(o => o.classList.remove('active'));

  if (nomEspace === 'lecteur') {
    vueLecteur.classList.add('active');
    vueAuteur.classList.remove('active');
    onglets[0].classList.add('active');
  } else {
    vueAuteur.classList.add('active');
    vueLecteur.classList.remove('active');
    onglets[1].classList.add('active');
  }
}

// Gestion de la boite modale de connexion
function ouvrirModalConnexion() {
  document.getElementById('modal-connexion').classList.add('active');
}

function fermerModalConnexion() {
  document.getElementById('modal-connexion').classList.remove('active');
}

// Bascule entre Connexion et Inscription dans la modale
function basculerModeAuth(mode) {
  const formConnexion = document.getElementById('form-connexion');
  const formInscription = document.getElementById('form-inscription');
  const btnTabConnexion = document.getElementById('btn-tab-connexion');
  const btnTabInscription = document.getElementById('btn-tab-inscription');

  if (mode === 'connexion') {
    formConnexion.classList.add('active');
    formInscription.classList.remove('active');
    btnTabConnexion.classList.add('active');
    btnTabInscription.classList.remove('active');
  } else {
    formInscription.classList.add('active');
    formConnexion.classList.remove('active');
    btnTabInscription.classList.add('active');
    btnTabConnexion.classList.remove('active');
  }
}