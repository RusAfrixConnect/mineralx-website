// js/factory.js - Version 1.0
let web3;
let userAccount;
let factoryContract;

// ⚠️⚠️⚠️ À MODIFIER APRÈS DÉPLOIEMENT ⚠️⚠️⚠️
let factoryContractAddress = "METTRE_L_ADRESSE_DU_CONTRACT_ICI";
const factoryContractABI = [ /* METTRE_L_ABI_DU_CONTRACT_ICI */ ];

// Au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof window.ethereum !== 'undefined') {
        web3 = new Web3(window.ethereum);
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAccount = accounts[0];
            document.getElementById('createTokenBtn').innerHTML = '🏭 Créer Maintenant (0.05 BNB)';
            document.getElementById('createTokenBtn').disabled = false;
            console.log("Compte connecté:", userAccount);
        } catch (error) {
            showStatus("❌ Erreur de connexion: " + error.message, "error");
        }
    } else {
        showStatus("⚠️ Installez MetaMask pour continuer.", "error");
        document.getElementById('createTokenBtn').innerHTML = 'MetaMask requis';
    }
    document.getElementById('createTokenBtn').addEventListener('click', createToken);
});

// FONCTION PRINCIPALE : Créer un token
async function createToken() {
    const tokenName = document.getElementById('tokenName').value.trim();
    const tokenSymbol = document.getElementById('tokenSymbol').value.trim().toUpperCase();
    const tokenSupply = document.getElementById('tokenSupply').value;

    if (!tokenName || !tokenSymbol || !tokenSupply) {
        showStatus("❌ Remplissez tous les champs.", "error");
        return;
    }

    const supplyInWei = web3.utils.toWei(tokenSupply, 'ether');
    const creationFee = web3.utils.toWei('0.05', 'ether');

    showStatus("⏳ Création en cours... Confirmez dans MetaMask.", "info");

    try {
        const result = await new web3.eth.Contract(factoryContractABI, factoryContractAddress)
            .methods.createToken(tokenName, tokenSymbol, supplyInWei)
            .send({ from: userAccount, value: creationFee, gas: 500000 });

        const tokenAddress = result.events.TokenCreated.returnValues.tokenAddress;
        const bscscanLink = `https://bscscan.com/token/${tokenAddress}`;
        const successMsg = `✅ Token créé!<br><strong>${tokenName} (${tokenSymbol})</strong><br>
                           <a href="${bscscanLink}" target="_blank" class="token-link">Voir sur BscScan</a>`;
        showStatus(successMsg, "success");

        document.getElementById('tokenName').value = '';
        document.getElementById('tokenSymbol').value = '';
        document.getElementById('tokenSupply').value = '';

    } catch (error) {
        console.error("Erreur:", error);
        showStatus(`❌ Échec: ${error.message}`, "error");
    }
}

// Afficher un message de statut
function showStatus(message, type) {
    const statusBox = document.getElementById('statusBox');
    statusBox.innerHTML = message;
    statusBox.className = `status-box status-${type}`;
    statusBox.style.display = 'block';
}
