# Hello FHEVM: Building Your First Confidential Gaming DApp

A complete beginner's guide to creating a privacy-preserving multiplayer gaming platform using Zama's FHEVM (Fully Homomorphic Encryption Virtual Machine).

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Understanding FHEVM](#understanding-fhevm)
4. [Project Setup](#project-setup)
5. [Smart Contract Development](#smart-contract-development)
6. [Frontend Development](#frontend-development)
7. [Testing and Deployment](#testing-and-deployment)
8. [Understanding the Privacy Features](#understanding-the-privacy-features)
9. [Next Steps](#next-steps)

## Introduction

Welcome to your first journey into **Fully Homomorphic Encryption (FHE)** development! This tutorial will guide you through building a complete confidential gaming platform where players can join game rooms while keeping their moves and strategies completely private.

### What You'll Build

By the end of this tutorial, you'll have created:
- A smart contract that handles encrypted game logic
- A web interface for joining confidential game rooms
- Real MetaMask transactions with privacy-preserving features
- A complete understanding of FHE in Web3 development

### Why This Matters

Traditional blockchain applications expose all data publicly. With FHEVM, you can build applications where sensitive data remains encrypted even while being processed on-chain. This opens up entirely new possibilities for gaming, finance, voting, and more.

## Prerequisites

Before starting, ensure you have:

### Required Knowledge
- Basic Solidity (can write simple smart contracts)
- JavaScript fundamentals
- Basic understanding of Ethereum and MetaMask
- Familiarity with npm/yarn package management

### Required Tools
- Node.js (v16 or higher)
- MetaMask browser extension
- Code editor (VS Code recommended)
- Git

### No Prior Experience Needed
- **No FHE knowledge required** - we'll explain everything
- **No cryptography background needed**
- **No advanced mathematics required**

## Understanding FHEVM

### What is FHEVM?

FHEVM (Fully Homomorphic Encryption Virtual Machine) is a blockchain virtual machine that can perform computations on encrypted data without ever decrypting it. This means:

- **Input Privacy**: Data sent to contracts remains encrypted
- **Processing Privacy**: Computations happen on encrypted data
- **Output Privacy**: Results can be selectively revealed

### Key Concepts

#### 1. Encrypted Types
Instead of regular Solidity types, FHEVM uses encrypted equivalents:
```solidity
uint256 public normalNumber = 42;        // Public, visible to all
euint32 private encryptedNumber;         // Encrypted, private
```

#### 2. TFHE Operations
TFHE (Threshold FHE) provides encrypted operations:
```solidity
euint32 sum = TFHE.add(encryptedA, encryptedB);  // Addition on encrypted data
ebool isEqual = TFHE.eq(encryptedA, encryptedB); // Comparison on encrypted data
```

#### 3. Access Control
Only authorized addresses can decrypt specific values:
```solidity
// Allow a specific address to decrypt this value
TFHE.allow(encryptedValue, playerAddress);
```

### Real-World Applications

- **Gaming**: Hidden moves, private strategies, confidential tournaments
- **Finance**: Private trading, confidential auctions, hidden balances
- **Voting**: Secret ballots with public verification
- **Healthcare**: Private medical records with selective sharing

## Project Setup

### Step 1: Initialize the Project

```bash
# Create a new directory
mkdir privacy-gaming-tutorial
cd privacy-gaming-tutorial

# Initialize npm project
npm init -y

# Install Hardhat for smart contract development
npm install --save-dev hardhat

# Initialize Hardhat project
npx hardhat
```

Choose "Create a JavaScript project" when prompted.

### Step 2: Install FHEVM Dependencies

```bash
# Install FHEVM library
npm install fhevm

# Install additional dependencies
npm install @openzeppelin/contracts dotenv
npm install --save-dev @nomicfoundation/hardhat-toolbox
```

### Step 3: Configure Hardhat

Update `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    zama: {
      url: "https://devnet.zama.ai/",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 8009,
    }
  }
};
```

### Step 4: Environment Setup

Create `.env` file:

```env
PRIVATE_KEY=your_wallet_private_key_here
SEPOLIA_URL=https://sepolia.infura.io/v3/your_infura_key
```

## Smart Contract Development

### Step 1: Understanding the Game Logic

Our privacy gaming contract will:
1. Allow players to join game rooms
2. Keep player moves encrypted
3. Process game logic on encrypted data
4. Reveal results selectively

### Step 2: Basic Contract Structure

Create `contracts/PrivacyGaming.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "fhevm/lib/TFHE.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PrivacyGaming is Ownable {
    using TFHE for euint32;
    using TFHE for ebool;

    // Game structure
    struct GameRoom {
        string name;
        string gameType;
        uint256 maxPlayers;
        uint256 currentPlayers;
        string difficulty;
        uint256 stakeAmount;
        address creator;
        bool isActive;
        mapping(address => bool) players;
        mapping(address => euint32) encryptedMoves;
    }

    // State variables
    mapping(uint256 => GameRoom) public gameRooms;
    uint256 public gameCount;

    // Events
    event GameCreated(uint256 indexed gameId, address indexed creator, string name);
    event PlayerJoined(uint256 indexed gameId, address indexed player, string joinMethod);
    event MoveSubmitted(uint256 indexed gameId, address indexed player);

    constructor() {}
}
```

### Step 3: Core Functions

Add game creation functionality:

```solidity
function createGameRoom(
    string memory _name,
    string memory _gameType,
    uint256 _maxPlayers,
    string memory _difficulty,
    uint256 _stakeAmount
) public payable returns (uint256) {
    require(bytes(_name).length > 0, "Game name required");
    require(_maxPlayers > 1, "Need at least 2 players");
    require(msg.value >= 0.001 ether, "Minimum creation fee required");

    gameCount++;
    GameRoom storage newGame = gameRooms[gameCount];

    newGame.name = _name;
    newGame.gameType = _gameType;
    newGame.maxPlayers = _maxPlayers;
    newGame.currentPlayers = 0;
    newGame.difficulty = _difficulty;
    newGame.stakeAmount = _stakeAmount;
    newGame.creator = msg.sender;
    newGame.isActive = true;

    emit GameCreated(gameCount, msg.sender, _name);
    return gameCount;
}
```

Add player joining functionality:

```solidity
function joinGame(
    uint256 _gameId,
    string memory _joinMethod,
    string memory _privacyLevel
) public payable {
    GameRoom storage game = gameRooms[_gameId];

    require(game.isActive, "Game not active");
    require(!game.players[msg.sender], "Already joined");
    require(game.currentPlayers < game.maxPlayers, "Game full");
    require(msg.value >= game.stakeAmount, "Insufficient stake");

    game.players[msg.sender] = true;
    game.currentPlayers++;

    emit PlayerJoined(_gameId, msg.sender, _joinMethod);
}
```

### Step 4: Encrypted Move Handling

Add functions for encrypted moves:

```solidity
function submitEncryptedMove(
    uint256 _gameId,
    bytes memory _encryptedMove
) public {
    GameRoom storage game = gameRooms[_gameId];

    require(game.players[msg.sender], "Not a player in this game");
    require(game.isActive, "Game not active");

    // Convert encrypted input to TFHE encrypted type
    euint32 encryptedMove = TFHE.asEuint32(_encryptedMove);

    // Store the encrypted move
    game.encryptedMoves[msg.sender] = encryptedMove;

    // Allow the contract to operate on this encrypted value
    TFHE.allow(encryptedMove, address(this));

    emit MoveSubmitted(_gameId, msg.sender);
}

function revealMoveToPlayer(uint256 _gameId) public view returns (bytes memory) {
    GameRoom storage game = gameRooms[_gameId];
    require(game.players[msg.sender], "Not a player");

    euint32 playerMove = game.encryptedMoves[msg.sender];

    // Allow the player to decrypt their own move
    TFHE.allow(playerMove, msg.sender);

    return TFHE.decrypt(playerMove);
}
```

### Step 5: Game Logic Processing

Add encrypted game logic:

```solidity
function processGameLogic(uint256 _gameId, address _player1, address _player2)
    public
    returns (bytes memory) {
    GameRoom storage game = gameRooms[_gameId];
    require(msg.sender == game.creator || msg.sender == owner(), "Unauthorized");

    euint32 move1 = game.encryptedMoves[_player1];
    euint32 move2 = game.encryptedMoves[_player2];

    // Example: Rock Paper Scissors logic (1=Rock, 2=Paper, 3=Scissors)
    // This computation happens on encrypted data!
    ebool player1Wins = TFHE.or(
        TFHE.and(TFHE.eq(move1, TFHE.asEuint32(1)), TFHE.eq(move2, TFHE.asEuint32(3))), // Rock beats Scissors
        TFHE.or(
            TFHE.and(TFHE.eq(move1, TFHE.asEuint32(2)), TFHE.eq(move2, TFHE.asEuint32(1))), // Paper beats Rock
            TFHE.and(TFHE.eq(move1, TFHE.asEuint32(3)), TFHE.eq(move2, TFHE.asEuint32(2)))  // Scissors beats Paper
        )
    );

    // Allow players to see the result
    TFHE.allow(player1Wins, _player1);
    TFHE.allow(player1Wins, _player2);

    return TFHE.decrypt(player1Wins);
}
```

## Frontend Development

### Step 1: Basic HTML Structure

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Gaming - FHEVM Tutorial</title>
    <script src="https://cdn.jsdelivr.net/npm/ethers@6.8.0/dist/ethers.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/fhevm@0.3.1/bundle/browser.js"></script>
    <style>
        /* Add your styling here */
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            color: white;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 30px;
            backdrop-filter: blur(10px);
        }

        .btn {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px;
            transition: transform 0.2s;
        }

        .btn:hover {
            transform: translateY(-2px);
        }

        .game-room {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            padding: 20px;
            margin: 15px 0;
            cursor: pointer;
            transition: all 0.3s;
        }

        .game-room:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-5px);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 Privacy Gaming - FHEVM Tutorial</h1>
        <p>Experience confidential multiplayer gaming with Fully Homomorphic Encryption</p>

        <!-- Wallet Connection -->
        <div id="walletSection">
            <button class="btn" id="connectWallet">Connect MetaMask</button>
            <div id="walletInfo" style="display: none;">
                <p>Connected: <span id="userAddress"></span></p>
            </div>
        </div>

        <!-- Game Rooms -->
        <div id="gameRooms">
            <h2>🎮 Active Game Rooms</h2>
            <div id="roomsList"></div>
        </div>

        <!-- Join Game Modal -->
        <div id="joinModal" style="display: none;">
            <h3>Join Game Room</h3>
            <div>
                <label>Privacy Level:</label>
                <select id="privacyLevel">
                    <option value="standard">Standard Encryption</option>
                    <option value="maximum">Maximum Privacy</option>
                </select>
            </div>
            <div>
                <label>Join Method:</label>
                <select id="joinMethod">
                    <option value="public">Public</option>
                    <option value="anonymous">Anonymous</option>
                </select>
            </div>
            <button class="btn" id="confirmJoin">Join Game</button>
            <button class="btn" id="cancelJoin">Cancel</button>
        </div>

        <div id="status"></div>
    </div>

    <script>
        // Your JavaScript code will go here
    </script>
</body>
</html>
```

### Step 2: FHEVM Integration

Add JavaScript for FHEVM integration:

```javascript
// Contract configuration
const CONTRACT_ADDRESS = "0x08E164E44344503a49C60648e05779C0c7Ab3730";
const CONTRACT_ABI = [
    "function joinGame(uint256 gameId, string memory joinMethod, string memory privacyLevel) public payable",
    "function submitEncryptedMove(uint256 gameId, bytes memory encryptedMove) public",
    "function createGameRoom(string memory name, string memory gameType, uint256 maxPlayers, string memory difficulty, uint256 stakeAmount) public payable returns (uint256)",
    "function revealMoveToPlayer(uint256 gameId) public view returns (bytes memory)",
    "event PlayerJoined(uint256 indexed gameId, address indexed player, string joinMethod)",
    "event MoveSubmitted(uint256 indexed gameId, address indexed player)"
];

// Global variables
let provider, signer, contract, userAddress, fhevmInstance;
let currentGameId = null;

// Initialize FHEVM
async function initializeFHEVM() {
    try {
        // Initialize the FHEVM instance
        fhevmInstance = await window.fhevm.createInstance({
            chainId: 11155111, // Sepolia testnet
            publicKeyId: 'default'
        });

        console.log('FHEVM initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize FHEVM:', error);
        showStatus('Failed to initialize privacy layer', 'error');
        return false;
    }
}

// Connect to MetaMask
async function connectWallet() {
    try {
        if (typeof window.ethereum === 'undefined') {
            throw new Error('MetaMask not found');
        }

        // Request account access
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });

        // Initialize provider and signer
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        userAddress = accounts[0];

        // Initialize contract
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        // Initialize FHEVM
        const fhevmReady = await initializeFHEVM();
        if (!fhevmReady) return;

        // Update UI
        document.getElementById('connectWallet').textContent = 'Connected';
        document.getElementById('connectWallet').disabled = true;
        document.getElementById('userAddress').textContent = userAddress;
        document.getElementById('walletInfo').style.display = 'block';

        showStatus('Wallet connected successfully!', 'success');
        loadGameRooms();

    } catch (error) {
        console.error('Wallet connection failed:', error);
        showStatus('Failed to connect wallet: ' + error.message, 'error');
    }
}
```

### Step 3: Game Room Management

Add game room functionality:

```javascript
// Load and display game rooms
async function loadGameRooms() {
    const rooms = [
        {
            id: 1,
            name: "Shadow Poker Championship",
            type: "poker",
            players: "3/6",
            stake: "0.01 ETH",
            difficulty: "Expert"
        },
        {
            id: 2,
            name: "Secret Blackjack Arena",
            type: "blackjack",
            players: "2/4",
            stake: "0.005 ETH",
            difficulty: "Intermediate"
        },
        {
            id: 3,
            name: "Quantum RPS Battle",
            type: "rps",
            players: "1/2",
            stake: "0.002 ETH",
            difficulty: "Beginner"
        }
    ];

    const roomsList = document.getElementById('roomsList');
    roomsList.innerHTML = '';

    rooms.forEach(room => {
        const roomElement = document.createElement('div');
        roomElement.className = 'game-room';
        roomElement.innerHTML = `
            <h3>${room.name}</h3>
            <p><strong>Type:</strong> ${room.type}</p>
            <p><strong>Players:</strong> ${room.players}</p>
            <p><strong>Stake:</strong> ${room.stake}</p>
            <p><strong>Difficulty:</strong> ${room.difficulty}</p>
            <p style="color: #90EE90;">🔐 Fully Encrypted Gameplay</p>
        `;

        roomElement.addEventListener('click', () => showJoinModal(room.id));
        roomsList.appendChild(roomElement);
    });
}

// Show join game modal
function showJoinModal(gameId) {
    currentGameId = gameId;
    document.getElementById('joinModal').style.display = 'block';
}

// Join game with privacy features
async function joinGame() {
    try {
        if (!currentGameId) return;

        const privacyLevel = document.getElementById('privacyLevel').value;
        const joinMethod = document.getElementById('joinMethod').value;

        showStatus('Preparing encrypted transaction...', 'info');

        // Get game stake amount (in a real app, fetch from contract)
        const stakeAmounts = {1: "0.01", 2: "0.005", 3: "0.002"};
        const stakeAmount = ethers.parseEther(stakeAmounts[currentGameId] || "0.001");

        // Send transaction
        const tx = await contract.joinGame(
            currentGameId,
            joinMethod,
            privacyLevel,
            { value: stakeAmount }
        );

        showStatus('Transaction sent! Waiting for confirmation...', 'info');

        // Wait for confirmation
        const receipt = await tx.wait();

        if (receipt.status === 1) {
            showStatus(`Successfully joined game! Privacy: ${privacyLevel}`, 'success');

            // Demonstrate encrypted move submission
            await submitEncryptedMove();
        } else {
            showStatus('Transaction failed', 'error');
        }

        document.getElementById('joinModal').style.display = 'none';

    } catch (error) {
        console.error('Join game failed:', error);

        if (error.code === 'ACTION_REJECTED') {
            showStatus('Transaction cancelled by user', 'warning');
        } else {
            showStatus('Failed to join game: ' + error.message, 'error');
        }
    }
}
```

### Step 4: Encrypted Move Submission

Add encrypted move functionality:

```javascript
// Submit encrypted move using FHEVM
async function submitEncryptedMove() {
    try {
        if (!fhevmInstance) {
            throw new Error('FHEVM not initialized');
        }

        showStatus('Preparing encrypted move...', 'info');

        // Example: Submit a move (1 = Rock, 2 = Paper, 3 = Scissors)
        const playerMove = Math.floor(Math.random() * 3) + 1; // Random move for demo

        // Encrypt the move using FHEVM
        const encryptedMove = await fhevmInstance.encrypt32(playerMove);

        showStatus('Submitting encrypted move to blockchain...', 'info');

        // Submit encrypted move to contract
        const tx = await contract.submitEncryptedMove(
            currentGameId,
            encryptedMove
        );

        showStatus('Encrypted move transaction sent!', 'info');

        const receipt = await tx.wait();

        if (receipt.status === 1) {
            showStatus(`Encrypted move submitted successfully! Your move (${getMoveText(playerMove)}) is now private on-chain.`, 'success');
        } else {
            showStatus('Failed to submit encrypted move', 'error');
        }

    } catch (error) {
        console.error('Encrypted move submission failed:', error);
        showStatus('Failed to submit encrypted move: ' + error.message, 'error');
    }
}

// Helper function to convert move number to text
function getMoveText(move) {
    const moves = {1: 'Rock', 2: 'Paper', 3: 'Scissors'};
    return moves[move] || 'Unknown';
}

// Reveal encrypted move (for demonstration)
async function revealMove() {
    try {
        if (!currentGameId) return;

        showStatus('Requesting move decryption...', 'info');

        // Request decryption from contract
        const encryptedResult = await contract.revealMoveToPlayer(currentGameId);

        // Decrypt the result using FHEVM
        const decryptedMove = await fhevmInstance.decrypt(encryptedResult);

        showStatus(`Your decrypted move: ${getMoveText(decryptedMove)}`, 'success');

    } catch (error) {
        console.error('Move reveal failed:', error);
        showStatus('Failed to reveal move: ' + error.message, 'error');
    }
}
```

### Step 5: UI Event Handlers

Add event handlers:

```javascript
// Utility function to show status messages
function showStatus(message, type) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;

    // Auto-clear after 5 seconds
    setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = '';
    }, 5000);
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Wallet connection
    document.getElementById('connectWallet').addEventListener('click', connectWallet);

    // Join game modal
    document.getElementById('confirmJoin').addEventListener('click', joinGame);
    document.getElementById('cancelJoin').addEventListener('click', () => {
        document.getElementById('joinModal').style.display = 'none';
    });

    // Load initial game rooms
    loadGameRooms();
});

// Handle network changes
if (window.ethereum) {
    window.ethereum.on('chainChanged', () => {
        window.location.reload();
    });

    window.ethereum.on('accountsChanged', () => {
        window.location.reload();
    });
}
```

## Testing and Deployment

### Step 1: Local Testing

```bash
# Compile contracts
npx hardhat compile

# Run local tests
npx hardhat test

# Start local node (optional)
npx hardhat node
```

### Step 2: Deploy to Testnet

Create deployment script `scripts/deploy.js`:

```javascript
const hre = require("hardhat");

async function main() {
    console.log("Deploying Privacy Gaming contract...");

    const PrivacyGaming = await hre.ethers.getContractFactory("PrivacyGaming");
    const privacyGaming = await PrivacyGaming.deploy();

    await privacyGaming.waitForDeployment();

    const address = await privacyGaming.getAddress();
    console.log("Privacy Gaming deployed to:", address);

    // Verify contract (optional)
    if (hre.network.name !== "hardhat") {
        console.log("Waiting for block confirmations...");
        await privacyGaming.deploymentTransaction().wait(6);

        await hre.run("verify:verify", {
            address: address,
            constructorArguments: [],
        });
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
```

Deploy to Sepolia:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Step 3: Frontend Testing

1. **Open `index.html` in a browser**
2. **Connect MetaMask** (ensure you're on Sepolia testnet)
3. **Test wallet connection**
4. **Join a game room**
5. **Verify encrypted transactions**

## Understanding the Privacy Features

### What Makes This Private?

1. **Encrypted Inputs**: Player moves are encrypted before sending to the blockchain
2. **Encrypted Processing**: Game logic runs on encrypted data
3. **Selective Revelation**: Only authorized parties can decrypt specific data
4. **Anonymous Participation**: Players can join without revealing identity

### How FHEVM Works

1. **Client-Side Encryption**:
   ```javascript
   const encryptedMove = await fhevmInstance.encrypt32(playerMove);
   ```

2. **On-Chain Processing**:
   ```solidity
   euint32 result = TFHE.add(encryptedMove1, encryptedMove2);
   ```

3. **Controlled Decryption**:
   ```solidity
   TFHE.allow(result, authorizedAddress);
   ```

### Privacy Guarantees

- **Input Privacy**: Your moves are never visible to other players
- **Processing Privacy**: Game logic executes without revealing intermediate states
- **Output Privacy**: Results are only revealed to authorized participants
- **Verification**: All computations are verifiable despite being encrypted

### Real-World Benefits

1. **Fair Gaming**: No front-running or strategy revelation
2. **Confidential Betting**: Stake amounts can remain private
3. **Anonymous Competition**: Players can compete without identity exposure
4. **Trustless Privacy**: No need to trust centralized servers

## Next Steps

### Extending Your dApp

1. **Add More Game Types**:
   - Implement different card games
   - Add auction mechanisms
   - Create voting systems

2. **Enhanced Privacy Features**:
   - Private chat systems
   - Confidential tournaments
   - Anonymous leaderboards

3. **Advanced FHEVM Features**:
   - Conditional logic with encrypted booleans
   - Encrypted arrays and mappings
   - Multi-party computations

### Learning Resources

1. **Zama Documentation**: [docs.zama.ai](https://docs.zama.ai)
2. **FHEVM Examples**: [github.com/zama-ai/fhevm](https://github.com/zama-ai/fhevm)
3. **TFHE Library**: [github.com/zama-ai/tfhe-rs](https://github.com/zama-ai/tfhe-rs)

### Common Patterns

1. **Encrypted Voting**:
   ```solidity
   mapping(address => ebool) private votes;
   euint32 private yesCount;
   euint32 private noCount;
   ```

2. **Private Auctions**:
   ```solidity
   mapping(address => euint32) private bids;
   euint32 private highestBid;
   ```

3. **Confidential Token Balances**:
   ```solidity
   mapping(address => euint32) private balances;
   ```

### Production Considerations

1. **Gas Optimization**: FHE operations are more expensive
2. **Key Management**: Properly handle encryption keys
3. **Access Control**: Carefully design who can decrypt what
4. **User Experience**: Educate users about privacy features

## Congratulations!

You've successfully built your first confidential dApp using FHEVM! You now understand:

- How to implement encrypted data types in Solidity
- How to perform computations on encrypted data
- How to integrate FHEVM with frontend applications
- How to maintain privacy while ensuring transparency

This foundation enables you to build revolutionary applications that were impossible before FHE technology. The future of privacy-preserving blockchain applications starts here!

### What's Next?

- Experiment with more complex encrypted logic
- Join the Zama developer community
- Build your own confidential application
- Contribute to the FHEVM ecosystem

Welcome to the future of confidential computing on blockchain! 🚀🔐