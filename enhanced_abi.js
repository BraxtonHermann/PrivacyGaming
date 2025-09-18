// Enhanced ABI for Privacy Gaming FHE Contract
const ENHANCED_CONTRACT_ABI = [
    {
        "inputs": [
            {"internalType": "string", "name": "_name", "type": "string"},
            {"internalType": "string", "name": "_gameType", "type": "string"},
            {"internalType": "uint8", "name": "_maxPlayers", "type": "uint8"},
            {"internalType": "string", "name": "_difficulty", "type": "string"},
            {"internalType": "uint256", "name": "_stake", "type": "uint256"}
        ],
        "name": "createGameRoom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "_gameId", "type": "uint256"},
            {"internalType": "bool", "name": "_isAnonymous", "type": "bool"},
            {"internalType": "bool", "name": "_maxPrivacy", "type": "bool"}
        ],
        "name": "joinGameRoom",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "_gameId", "type": "uint256"},
            {"internalType": "uint8", "name": "_move", "type": "uint8"},
            {"internalType": "bool", "name": "_isValid", "type": "bool"}
        ],
        "name": "submitMove",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getActiveGames",
        "outputs": [
            {"internalType": "uint256[]", "name": "gameIds", "type": "uint256[]"},
            {"internalType": "string[]", "name": "names", "type": "string[]"},
            {"internalType": "string[]", "name": "gameTypes", "type": "string[]"},
            {"internalType": "uint8[]", "name": "maxPlayersArray", "type": "uint8[]"},
            {"internalType": "uint8[]", "name": "currentPlayersArray", "type": "uint8[]"},
            {"internalType": "string[]", "name": "difficulties", "type": "string[]"},
            {"internalType": "uint256[]", "name": "stakes", "type": "uint256[]"},
            {"internalType": "address[]", "name": "creators", "type": "address[]"},
            {"internalType": "bool[]", "name": "activeStatus", "type": "bool[]"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "_player", "type": "address"}
        ],
        "name": "getPlayerStats",
        "outputs": [
            {"internalType": "uint256", "name": "totalGames", "type": "uint256"},
            {"internalType": "uint256", "name": "gamesWon", "type": "uint256"},
            {"internalType": "uint256", "name": "totalStaked", "type": "uint256"},
            {"internalType": "bool", "name": "isRegistered", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getContractBalance",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    // Events
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256"},
            {"indexed": false, "internalType": "string", "name": "name", "type": "string"},
            {"indexed": false, "internalType": "string", "name": "gameType", "type": "string"},
            {"indexed": false, "internalType": "uint8", "name": "maxPlayers", "type": "uint8"},
            {"indexed": false, "internalType": "uint256", "name": "stake", "type": "uint256"},
            {"indexed": true, "internalType": "address", "name": "creator", "type": "address"}
        ],
        "name": "GameRoomCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256"},
            {"indexed": true, "internalType": "address", "name": "player", "type": "address"},
            {"indexed": false, "internalType": "uint8", "name": "currentPlayers", "type": "uint8"}
        ],
        "name": "PlayerJoined",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256"},
            {"indexed": false, "internalType": "uint8", "name": "playerCount", "type": "uint8"}
        ],
        "name": "GameStarted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256"},
            {"indexed": true, "internalType": "address", "name": "winner", "type": "address"},
            {"indexed": false, "internalType": "uint256", "name": "prizePool", "type": "uint256"}
        ],
        "name": "GameFinished",
        "type": "event"
    }
];