const auth = document.getElementById('auth');
const openAuth = document.getElementById('open-auth');
const heroAuth = document.getElementById('hero-signup');

const authTitle = document.getElementById('auth-title');
const authBtn = document.getElementById('auth-btn');
const switchAuth = document.getElementById('switch-auth');
const nameField = document.getElementById('nameField');

const home = document.getElementById('home');
const homeNav = document.getElementById('home-nav');

const priceNav = document.getElementById('price-nav');

let mode = 'signin';

openAuth.onclick = () => {
    home.style.display = 'none';
    auth.style.display = 'block';
    window.scrollTo(0, auth.offsetTop - 20);
}

homeNav.onclick = () => {
    mode = 'signin';
    updateAuthMode();
    
    home.style.display = 'block';
    auth.style.display = 'none';
}

heroAuth.onclick = () => {
    mode = 'signup';
    updateAuthMode();

    home.style.display = 'none';
    auth.style.display = 'block';
    window.scrollTo(0, auth.offsetTop - 20);
}

function updateAuthMode() {
    if (mode === 'signin') {
        authTitle.textContent = 'Sign In';
        authBtn.textContent = 'Login';
        nameField.style.display = 'none';
        switchAuth.textContent = "Don't have an account? Sign Up";
    } else {
        authTitle.textContent = 'Create Your Account';
        authBtn.textContent = 'Create Account';
        nameField.style.display = 'block';
        switchAuth.textContent = "Already have an account? Sign In";
    }
}

switchAuth.onclick = () => {
    mode = mode === 'signin' ? 'signup' : 'signin';
    updateAuthMode();
}

updateAuthMode();