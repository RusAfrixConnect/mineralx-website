// js/factory.js - Version 1.0
let web3;
let userAccount;
let factoryContract;

// ⚠️ À MODIFIER APRÈS DÉPLOIEMENT DU CONTRAT ⚠️
let factoryContractAddress = "0x3c210c76104A7Ac2F40366963bD2d9FD78214832";
const factoryContractABI = [ /[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"tokenAddress","type":"address"},{"indexed":false,"internalType":"string","name":"name","type":"string"},{"indexed":false,"internalType":"string","name":"symbol","type":"string"},{"indexed":false,"internalType":"uint256","name":"supply","type":"uint256"},{"indexed":false,"internalType":"address","name":"creator","type":"address"}],"name":"TokenCreated","type":"event"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"allTokens","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"_name","type":"string"},{"internalType":"string","name":"_symbol","type":"string"},{"internalType":"uint256","name":"_initialSupply","type":"uint256"}],"name":"createToken","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"creationFee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getTokenCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_newFee","type":"uint256"}],"name":"setCreationFee","outputs":[],"stateMutability":"nonpayable","type":"function"}]/ ];

// Dictionnaire des traductions pour le bouton (en phase avec factory.html)
const buttonTranslations = {
    'fr': { 'create': '🏭 Créer Maintenant (0.05 BNB)', 'connect': '🔗 Connectez votre portefeuille', 'metamask': 'MetaMask requis' },
    'en': { 'create': '🏭 Create Now (0.05 BNB)', 'connect': '🔗 Connect your wallet', 'metamask': 'MetaMask required' },
    'ru': { 'create': '🏭 Создать сейчас (0.05 BNB)', 'connect': '🔗 Подключите ваш кошелек', 'metamask': 'Требуется MetaMask' }
};

// Fonction pour mettre à jour le texte des boutons selon la langue
function updateButtonText(lang) {
    const connectBtn = document.getElementById('createTokenBtn');
    if (!connectBtn) return;
    
    if (connectBtn.disabled) {
        // Si le bouton est désactivé (pas encore connecté)
        const textKey = connectBtn.innerHTML.includes('MetaMask') ? 'metamask' : 'connect';
        connectBtn.innerHTML = buttonTranslations[lang]?.[textKey] || buttonTranslations['fr'][textKey];
    } else {
        // Si le bouton est activé (connecté et prêt à créer)
        connectBtn.innerHTML = buttonTranslations[lang]?.['create'] || buttonTranslations['fr']['create'];
    }
}

// Toute la logique est encapsulée ici, après le chargement de la page
document.addEventListener('DOMContentLoaded', function() {

    // Met à jour le bouton avec la langue sauvegardée au démarrage
    const savedLang = localStorage.getItem('preferredLanguage') || 'fr';
    updateButtonText(savedLang);

    // Gestion de la connexion Web3
    if (typeof window.ethereum !== 'undefined') {
        web3 = new Web3(window.ethereum);
        console.log("Web3 détecté.");
        
        // Écouteur pour le changement de compte
        window.ethereum.on('accountsChanged', function (accounts) {
            userAccount = accounts[0];
            console.log("Compte changé:", userAccount);
        });
    } else {
        // MetaMask n'est pas installé
        showStatus("⚠️ " + (buttonTranslations[savedLang]?.['metamask'] || 'MetaMask requis'), "error");
        document.getElementById('createTokenBtn').innerHTML = buttonTranslations[savedLang]?.['metamask'] || 'MetaMask requis';
    }

    // Gestionnaire d'événement pour le bouton principal
    document.getElementById('createTokenBtn').addEventListener('click', async function() {
        if (!userAccount) {
            // Si non connecté, on demande la connexion
            await connectWallet();
        } else {
            // Si déjà connecté, on crée le token
            await createToken();
        }
    });
});

// Fonction pour connecter le portefeuille
async function connectWallet() {
    const savedLang = localStorage.getItem('preferredLanguage') || 'fr';
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAccount = accounts[0];
            console.log("Compte connecté:", userAccount);
            
            // Active le bouton et change son texte
            document.getElementById('createTokenBtn').disabled = false;
            updateButtonText(savedLang);
            showStatus("✅ Portefeuille connecté avec succès !", "success");
            
        } catch (error) {
            console.error("Erreur de connexion:", error);
            showStatus("❌ Erreur de connexion: " + error.message, "error");
        }
    } else {
        showStatus("⚠️ " + (buttonTranslations[savedLang]?.['metamask'] || 'MetaMask requis'), "error");
    }
}

// FONCTION PRINCIPALE : Créer un token
async function createToken() {
    const tokenName = document.getElementById('tokenName').value.trim();
    const tokenSymbol = document.getElementById('tokenSymbol').value.trim().toUpperCase();
    const tokenSupply = document.getElementById('tokenSupply').value;

    if (!tokenName || !tokenSymbol || !tokenSupply) {
        showStatus("❌ Veuillez remplir tous les champs obligatoires.", "error");
        return;
    }

    const savedLang = localStorage.getItem('preferredLanguage') || 'fr';
    const supplyInWei = web3.utils.toWei(tokenSupply, 'ether');
    const creationFee = web3.utils.toWei('0.05', 'ether');

    showStatus("⏳ Création en cours... Veuillez confirmer la transaction dans votre portefeuille.", "info");

    try {
        const result = await new web3.eth.Contract(factoryContractABI, factoryContractAddress)
            .methods.createToken(tokenName, tokenSymbol, supplyInWei)
            .send({ from: userAccount, value: creationFee, gas: 500000 });

        const tokenAddress = result.events.TokenCreated.returnValues.tokenAddress;
        const bscscanLink = `https://bscscan.com/token/${tokenAddress}`;
        const successMsg = `✅ Token créé avec succès!<br><strong>${tokenName} (${tokenSymbol})</strong><br>
                           <a href="${bscscanLink}" target="_blank" class="token-link">Voir sur BscScan</a>`;
        showStatus(successMsg, "success");

        // Réinitialise le formulaire
        document.getElementById('tokenName').value = '';
        document.getElementById('tokenSymbol').value = '';
        document.getElementById('tokenSupply').value = '';

    } catch (error) {
        console.error("Erreur lors de la création:", error);
        showStatus(`❌ Échec de la création: ${error.message}`, "error");
    }
}

// Afficher un message de statut
function showStatus(message, type) {
    const statusBox = document.getElementById('statusBox');
    statusBox.innerHTML = message;
    statusBox.className = `status-box status-${type}`;
    statusBox.style.display = 'block';
}
