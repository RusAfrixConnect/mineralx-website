// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Interface pour le token standard ERC-20
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

// Contrat principal de la Factory MineralX
contract MineralXTokenFactory {
    address public owner;
    uint256 public creationFee = 0.05 ether; // Frais de création (0.05 BNB)
    address[] public allTokens;

    // Événement émis à chaque création
    event TokenCreated(address indexed tokenAddress, string name, string symbol, uint256 supply, address creator);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Seul le proprietaire peut faire cela");
        _;
    }

    // FONCTION PRINCIPALE : Créer un nouveau token
    function createToken(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply
    ) external payable returns (address) {
        require(msg.value >= creationFee, "Frais de creation insuffisants");

        // Crée le nouveau token
        MineralXToken newToken = new MineralXToken(_name, _symbol, _initialSupply, msg.sender);

        // Stocke et émet l'événement
        allTokens.push(address(newToken));
        emit TokenCreated(address(newToken), _name, _symbol, _initialSupply, msg.sender);

        // Transfère les frais au propriétaire
        payable(owner).transfer(msg.value);

        return address(newToken);
    }

    function setCreationFee(uint256 _newFee) external onlyOwner {
        creationFee = _newFee;
    }

    function getTokenCount() external view returns (uint256) {
        return allTokens.length;
    }
}

// Contrat de token ERC-20 standard qui sera cloné
contract MineralXToken is IERC20 {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 private _totalSupply;
    address public tokenOwner;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply,
        address _owner
    ) {
        name = _name;
        symbol = _symbol;
        tokenOwner = _owner;
        _totalSupply = _initialSupply * (10 ** uint256(decimals));
        _balances[_owner] = _totalSupply;
        emit Transfer(address(0), _owner, _totalSupply);
    }

    // Fonctions ERC-20 standards
    function totalSupply() public view override returns (uint256) { return _totalSupply; }
    function balanceOf(address account) public view override returns (uint256) { return _balances[account]; }
    function transfer(address recipient, uint256 amount) public override returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }
    function allowance(address _owner, address spender) public view override returns (uint256) {
        return _allowances[_owner][spender];
    }
    function approve(address spender, uint256 amount) public override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }
    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        _transfer(sender, recipient, amount);
        _approve(sender, msg.sender, _allowances[sender][msg.sender] - amount);
        return true;
    }

    // Fonctions internes
    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "Transfer depuis l'adresse zero");
        require(recipient != address(0), "Transfer vers l'adresse zero");
        require(_balances[sender] >= amount, "Solde insuffisant");
        _balances[sender] -= amount;
        _balances[recipient] += amount;
        emit Transfer(sender, recipient, amount);
    }
    function _approve(address _owner, address spender, uint256 amount) internal {
        require(_owner != address(0), "Approbation depuis l'adresse zero");
        require(spender != address(0), "Approbation vers l'adresse zero");
        _allowances[_owner][spender] = amount;
        emit Approval(_owner, spender, amount);
    }
}
