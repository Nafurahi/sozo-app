import { FormEvent, useEffect, useMemo, useState } from 'react';

type Space = 'reader' | 'author';
type AuthMode = 'login' | 'signup';
type AuthStep = 'credentials' | 'code';
type User = { email: string; role: 'reader' | 'author'; name: string };
type Story = { title: string; author: string; type: string; rating: string; readers: string; tone: 'wine' | 'gold' | 'ink' };

const stories: Story[] = [
  { title: 'Le Voyage des Ombres', author: 'Amani', type: 'Livre', rating: '4.9', readers: '120', tone: 'wine' },
  { title: 'Pensées du Soir', author: 'K. Furaha', type: 'Recueil', rating: '4.7', readers: '85', tone: 'gold' },
  { title: 'Les Jardins du silence', author: 'Nora B.', type: 'Poésie', rating: '4.8', readers: '64', tone: 'ink' },
  { title: 'Après la dernière page', author: 'S. Kamanzi', type: 'Romance', rating: '4.6', readers: '92', tone: 'wine' },
  { title: 'La Maison aux fenêtres bleues', author: 'I. Diallo', type: 'Mystère', rating: '4.9', readers: '143', tone: 'gold' },
  { title: 'Éclats de lune', author: 'Maya R.', type: 'Fantastique', rating: '4.8', readers: '76', tone: 'ink' },
];

function Icon({ name }: { name: 'book' | 'pen' | 'search' | 'plus' | 'close' }) {
  const paths = {
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M8 7h8M8 10h6" /></>,
    pen: <><path d="m14 6 4 4" /><path d="M4 20h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4 16v4Z" /></>,
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="icon">{paths[name]}</svg>;
}

export function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [space, setSpace] = useState<Space>('reader');
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authStep, setAuthStep] = useState<AuthStep>('credentials');
  const [authOpen, setAuthOpen] = useState(false);
  const [lampOn, setLampOn] = useState(false);
  const [requestedRole, setRequestedRole] = useState<'reader' | 'author'>('reader');
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 2600);
    return () => window.clearTimeout(timer);
  }, []);

  const filteredStories = useMemo(() => stories.filter((story) =>
    `${story.title} ${story.author} ${story.type}`.toLowerCase().includes(query.toLowerCase()),
  ), [query]);

  const toggleFavorite = (title: string) => setFavorites((current) => current.includes(title)
    ? current.filter((item) => item !== title)
    : [...current, title]);

  const openAuthorSpace = async () => {
    if (user?.role === 'author') {
      setSpace('author');
      return;
    }
    setRequestedRole('author');
    setAuthMode('login');
    setAuthStep('credentials');
    setAuthError('');
    setAuthOpen(true);
  };

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError('');
    const formData = new FormData(event.currentTarget);
    const endpoint = authMode === 'signup'
      ? '/api/auth/signup'
      : authStep === 'credentials' ? '/api/auth/request-code' : '/api/auth/verify-code';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: formData.get('email'),
        password: authStep === 'credentials' ? formData.get('password') : undefined,
        code: authStep === 'code' ? formData.get('code') : undefined,
        name: formData.get('name'),
        role: requestedRole,
      }),
    });
    const result = await response.json() as { user?: User; error?: string; message?: string };
    if (authMode === 'login' && authStep === 'credentials' && response.ok) {
      setAuthStep('code');
      setNotice(result.message || 'Un code vient d’être envoyé à votre adresse e-mail.');
      return;
    }
    if (!response.ok || !result.user) {
      setAuthError(result.error || 'Une erreur est survenue.');
      return;
    }
    setUser(result.user);
    setAuthOpen(false);
    setLampOn(false);
    if (requestedRole === 'author') {
      setSpace('author');
      setNotice('Connexion auteur réussie.');
    } else {
      setNotice(authMode === 'login' ? 'Bienvenue dans votre bibliothèque.' : 'Votre compte Sozo est prêt.');
    }
  };

  return <>
    {showSplash && <div className="splash-screen" role="status" aria-label="Bienvenue sur Sozo">
      <div className="splash-mark" aria-hidden="true">
        <svg viewBox="0 0 120 170" className="splash-feather">
          <path d="M57 151c-6-25 4-45 28-64 17-14 27-31 24-59-22 18-32 42-37 65-9-11-10-25-4-39-20 18-27 39-17 57-13-5-22 1-25 15 12-5 22-1 31 6Z" />
          <path d="M55 149c8-28 24-48 51-72" />
        </svg>
      </div>
      <h1>SOZO</h1>
      <p>bienvenue !</p>
    </div>}
    <div className={showSplash ? 'app-shell app-hidden' : 'app-shell'}>
    <header className="topbar">
      <a className="brand" href="#accueil"><span>Sōzō</span><small>ÉCRIRE & LIRE</small></a>
      <nav className="space-switcher" aria-label="Espaces Sozo">
        <button className={space === 'reader' ? 'space-tab active' : 'space-tab'} onClick={() => setSpace('reader')}><Icon name="book" />Espace Lecteur</button>
        <button className={space === 'author' ? 'space-tab active' : 'space-tab'} onClick={openAuthorSpace}><Icon name="pen" />Espace Auteur</button>
      </nav>
      <button className="login-link" onClick={() => setAuthOpen(true)}>Se connecter</button>
    </header>

    <main className="main-content" id="accueil">
      {notice && <div className="notice" role="status">{notice}<button aria-label="Fermer" onClick={() => setNotice('')}><Icon name="close" /></button></div>}
      {space === 'reader' ? <section className="reader-view">
        <div className="section-heading"><div><p className="eyebrow">Votre prochaine histoire</p><h1>Bibliothèque & découvertes</h1><p className="heading-copy">Des mots à lire, des mondes à trouver.</p></div><label className="search-box"><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une histoire..." /></label></div>
        <div className="category-row"><span>Explorer par genre</span><button className="category active">Tout</button><button className="category">Roman</button><button className="category">Poésie</button><button className="category">Mystère</button><button className="category">Fantastique</button></div>
        <div className="section-label"><h2>À la une</h2><span>{filteredStories.length} histoires</span></div>
        <div className="story-grid">{filteredStories.map((story) => <article className="story-card" key={story.title}><div className={`cover ${story.tone}`}><span>{story.type}</span><button className={favorites.includes(story.title) ? 'favorite selected' : 'favorite'} aria-label={`Ajouter ${story.title} aux favoris`} onClick={() => toggleFavorite(story.title)}>{favorites.includes(story.title) ? '★' : '☆'}</button><strong>{story.title}</strong></div><div className="story-info"><h3>{story.title}</h3><p>Par {story.author}</p><div className="story-meta"><span>★ {story.rating} <small>({story.readers})</small></span><button onClick={() => setNotice(`Lecture de « ${story.title} » ouverte.`)}>Lire</button></div></div></article>)}</div>
      </section> : <section className="author-view"><div className="section-heading"><div><p className="eyebrow">Votre atelier personnel</p><h1>Studio de création</h1><p className="heading-copy">Donnez une voix à vos idées.</p></div><button className="primary-button" onClick={() => setNotice('Le nouvel éditeur sera bientôt disponible.')}><Icon name="plus" />Nouvelle œuvre</button></div><div className="stats"><div><span>Œuvres publiées</span><strong>3</strong></div><div><span>Lecteurs totaux</span><strong>1 420</strong></div><div><span>Abonnés</span><strong>310</strong></div></div><div className="manuscripts"><div className="section-label"><h2>Mes manuscrits en cours</h2><span>2 œuvres</span></div><div className="manuscript-row"><div><strong>Les Murmures de la Nuit</strong><span className="status draft">Brouillon</span></div><button onClick={() => setNotice('Ouverture de l’éditeur...')}>Éditer</button></div><div className="manuscript-row"><div><strong>Chroniques d'un Hiver</strong><span className="status published">Publié</span></div><button onClick={() => setNotice('Chargement des statistiques...')}>Statistiques</button></div></div></section>}
    </main>

    {authOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setAuthOpen(false); }}><div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="modal-close" aria-label="Fermer" onClick={() => setAuthOpen(false)}><Icon name="close" /></button><div className="auth-title"><p className="eyebrow">{requestedRole === 'author' ? 'Accès auteur sécurisé' : 'Rejoindre Sozo'}</p><h2 id="auth-title">{lampOn ? (authStep === 'code' ? 'Vérifiez votre e-mail' : 'Bienvenue dans votre atelier') : 'Allumez la lampe'}</h2><p>{lampOn ? (authStep === 'code' ? 'Saisissez le code reçu pour continuer.' : 'Votre espace de lecture et d’écriture vous attend.') : 'Une petite lumière pour ouvrir la porte.'}</p></div><button className={lampOn ? 'lamp on' : 'lamp'} aria-label="Allumer la lampe" onClick={() => setLampOn((current) => !current)}><span className="shade" /><span className="stand" /><span className="cord" /></button>{authStep === 'credentials' && <div className="auth-tabs"><button type="button" className={authMode === 'login' ? 'active' : ''} onClick={() => { setAuthMode('login'); setAuthError(''); }}>Connexion</button><button type="button" className={authMode === 'signup' ? 'active' : ''} onClick={() => { setAuthMode('signup'); setAuthError(''); }}>Inscription</button></div>}{authError && <p className="auth-error" role="alert">{authError}</p>}<form onSubmit={submitAuth}><label>Adresse e-mail<input name="email" type="email" placeholder="exemple@domaine.com" required /></label>{authMode === 'signup' && authStep === 'credentials' && <label>Pseudo<input name="name" type="text" placeholder="Ton pseudo" required /></label>}{authMode === 'login' && authStep === 'code' ? <label>Code reçu par e-mail<input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="123456" required /></label> : <label>Mot de passe<input name="password" type="password" placeholder="••••••••" required /></label>}<button className="primary-button full" disabled={!lampOn}>{authMode === 'login' ? (authStep === 'code' ? 'Vérifier le code' : 'Envoyer le code') : 'Créer mon compte'}</button></form></div></div>}
    </div>
  </>;
}
