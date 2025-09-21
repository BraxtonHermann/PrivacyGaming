// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint8, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract PrivacyGaming is SepoliaConfig {
    using FHE for euint8;
    using FHE for ebool;

    // Ownership functionality
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    struct GameRoom {
        uint256 gameId;
        string name;
        string gameType;
        uint8 maxPlayers;
        uint8 currentPlayers;
        string difficulty;
        uint256 stake;
        address creator;
        bool isActive;
        uint256 createdAt;
        address[] players;
        mapping(address => bool) hasJoined;
        mapping(address => ebool) isAnonymous; // FHE encrypted anonymity status
        mapping(address => ebool) maxPrivacy;  // FHE encrypted privacy level
    }

    struct Player {
        address playerAddress;
        uint256 totalGames;
        uint256 gamesWon;
        uint256 totalStaked;
        bool isRegistered;
    }

    struct GameMove {
        uint256 gameId;
        address player;
        euint8 encryptedMove;     // FHE encrypted move
        ebool isValid;            // FHE encrypted validity
        uint256 timestamp;
    }

    // State variables
    uint256 private gameIdCounter;
    mapping(uint256 => GameRoom) public gameRooms;
    mapping(address => Player) public players;
    mapping(uint256 => GameMove[]) public gameMoves;
    mapping(uint256 => bool) public gameFinished;
    mapping(uint256 => address) public gameWinners;

    uint256[] public activeGameIds;
    uint256 public constant MIN_STAKE = 0.001 ether;
    uint256 public constant MAX_STAKE = 10 ether;

    // Events
    event GameRoomCreated(
        uint256 indexed gameId,
        string name,
        string gameType,
        uint8 maxPlayers,
        uint256 stake,
        address indexed creator
    );

    event PlayerJoined(
        uint256 indexed gameId,
        address indexed player,
        uint8 currentPlayers
    );

    event GameStarted(uint256 indexed gameId, uint8 playerCount);

    event MoveSubmitted(
        uint256 indexed gameId,
        address indexed player,
        uint256 timestamp
    );

    event GameFinished(
        uint256 indexed gameId,
        address indexed winner,
        uint256 prizePool
    );

    constructor() {
        owner = msg.sender;
        gameIdCounter = 1;
    }

    /**
     * @dev Transfer ownership to a new owner
     */
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner is the zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /**
     * @dev Create a new game room
     */
    function createGameRoom(
        string memory _name,
        string memory _gameType,
        uint8 _maxPlayers,
        string memory _difficulty,
        uint256 _stake
    ) external {
        require(bytes(_name).length > 0, "Game name required");
        require(_maxPlayers >= 2 && _maxPlayers <= 10, "Invalid player count");
        require(_stake >= MIN_STAKE && _stake <= MAX_STAKE, "Invalid stake amount");

        uint256 newGameId = gameIdCounter++;

        GameRoom storage newRoom = gameRooms[newGameId];
        newRoom.gameId = newGameId;
        newRoom.name = _name;
        newRoom.gameType = _gameType;
        newRoom.maxPlayers = _maxPlayers;
        newRoom.currentPlayers = 0;
        newRoom.difficulty = _difficulty;
        newRoom.stake = _stake;
        newRoom.creator = msg.sender;
        newRoom.isActive = true;
        newRoom.createdAt = block.timestamp;

        activeGameIds.push(newGameId);

        // Register player if not already registered
        if (!players[msg.sender].isRegistered) {
            players[msg.sender] = Player({
                playerAddress: msg.sender,
                totalGames: 0,
                gamesWon: 0,
                totalStaked: 0,
                isRegistered: true
            });
        }

        emit GameRoomCreated(newGameId, _name, _gameType, _maxPlayers, _stake, msg.sender);
    }

    /**
     * @dev Join a game room with FHE encrypted privacy settings
     */
    function joinGameRoom(
        uint256 _gameId,
        bool _isAnonymous,
        bool _maxPrivacy
    ) external payable {
        GameRoom storage room = gameRooms[_gameId];

        require(room.isActive, "Game room not active");
        require(!room.hasJoined[msg.sender], "Already joined this game");
        require(room.currentPlayers < room.maxPlayers, "Game room is full");
        require(msg.value == room.stake, "Incorrect stake amount");

        // Convert boolean privacy settings to FHE encrypted values
        room.isAnonymous[msg.sender] = FHE.asEbool(_isAnonymous);
        room.maxPrivacy[msg.sender] = FHE.asEbool(_maxPrivacy);
        room.hasJoined[msg.sender] = true;
        room.players.push(msg.sender);
        room.currentPlayers++;

        // Register player if not already registered
        if (!players[msg.sender].isRegistered) {
            players[msg.sender] = Player({
                playerAddress: msg.sender,
                totalGames: 0,
                gamesWon: 0,
                totalStaked: 0,
                isRegistered: true
            });
        }

        players[msg.sender].totalStaked += msg.value;

        emit PlayerJoined(_gameId, msg.sender, room.currentPlayers);

        // Start game if room is full
        if (room.currentPlayers == room.maxPlayers) {
            _startGame(_gameId);
        }
    }

    /**
     * @dev Submit an encrypted game move using FHE
     */
    function submitMove(
        uint256 _gameId,
        uint8 _move,
        bool _isValid
    ) external {
        GameRoom storage room = gameRooms[_gameId];

        require(room.hasJoined[msg.sender], "Not a player in this game");
        require(!gameFinished[_gameId], "Game already finished");

        // Encrypt the move and validity using FHE
        euint8 encryptedMove = FHE.asEuint8(_move);
        ebool encryptedValidity = FHE.asEbool(_isValid);

        gameMoves[_gameId].push(GameMove({
            gameId: _gameId,
            player: msg.sender,
            encryptedMove: encryptedMove,
            isValid: encryptedValidity,
            timestamp: block.timestamp
        }));

        emit MoveSubmitted(_gameId, msg.sender, block.timestamp);

        // Check if all players have submitted moves (simplified logic)
        if (gameMoves[_gameId].length >= room.currentPlayers) {
            _evaluateGame(_gameId);
        }
    }

    /**
     * @dev Get active game rooms (public view)
     */
    function getActiveGames() external view returns (
        uint256[] memory gameIds,
        string[] memory names,
        string[] memory gameTypes,
        uint8[] memory maxPlayersArray,
        uint8[] memory currentPlayersArray,
        string[] memory difficulties,
        uint256[] memory stakes,
        address[] memory creators,
        bool[] memory activeStatus
    ) {
        uint256 activeCount = 0;

        // Count active games
        for (uint256 i = 0; i < activeGameIds.length; i++) {
            if (gameRooms[activeGameIds[i]].isActive) {
                activeCount++;
            }
        }

        // Initialize arrays
        gameIds = new uint256[](activeCount);
        names = new string[](activeCount);
        gameTypes = new string[](activeCount);
        maxPlayersArray = new uint8[](activeCount);
        currentPlayersArray = new uint8[](activeCount);
        difficulties = new string[](activeCount);
        stakes = new uint256[](activeCount);
        creators = new address[](activeCount);
        activeStatus = new bool[](activeCount);

        uint256 index = 0;
        for (uint256 i = 0; i < activeGameIds.length; i++) {
            uint256 gameId = activeGameIds[i];
            GameRoom storage room = gameRooms[gameId];

            if (room.isActive) {
                gameIds[index] = room.gameId;
                names[index] = room.name;
                gameTypes[index] = room.gameType;
                maxPlayersArray[index] = room.maxPlayers;
                currentPlayersArray[index] = room.currentPlayers;
                difficulties[index] = room.difficulty;
                stakes[index] = room.stake;
                creators[index] = room.creator;
                activeStatus[index] = room.isActive;
                index++;
            }
        }
    }

    /**
     * @dev Check if player is playing anonymously (only player can decrypt)
     */
    function isPlayerAnonymous(uint256 _gameId, address _player)
        external
        view
        returns (ebool)
    {
        require(
            msg.sender == _player || msg.sender == owner,
            "Not authorized to view this information"
        );
        return gameRooms[_gameId].isAnonymous[_player];
    }

    /**
     * @dev Get player statistics
     */
    function getPlayerStats(address _player)
        external
        view
        returns (
            uint256 totalGames,
            uint256 gamesWon,
            uint256 totalStaked,
            bool isRegistered
        )
    {
        Player storage player = players[_player];
        return (
            player.totalGames,
            player.gamesWon,
            player.totalStaked,
            player.isRegistered
        );
    }

    /**
     * @dev Internal function to start a game
     */
    function _startGame(uint256 _gameId) internal {
        GameRoom storage room = gameRooms[_gameId];

        // Update player stats
        for (uint256 i = 0; i < room.players.length; i++) {
            players[room.players[i]].totalGames++;
        }

        emit GameStarted(_gameId, room.currentPlayers);
    }

    /**
     * @dev Internal function to evaluate game results (simplified)
     */
    function _evaluateGame(uint256 _gameId) internal {
        GameRoom storage room = gameRooms[_gameId];

        // Simplified winner determination (in practice, this would use FHE operations)
        // For demo purposes, first player wins
        address winner = room.players[0];

        gameFinished[_gameId] = true;
        gameWinners[_gameId] = winner;
        room.isActive = false;

        // Calculate prize pool (total stakes minus small platform fee)
        uint256 totalPrize = room.stake * room.currentPlayers;
        uint256 platformFee = totalPrize / 100; // 1% fee
        uint256 winnerPrize = totalPrize - platformFee;

        // Update winner stats
        players[winner].gamesWon++;

        // Transfer prize to winner
        payable(winner).transfer(winnerPrize);

        emit GameFinished(_gameId, winner, winnerPrize);
    }

    /**
     * @dev Emergency function to end a game (only owner)
     */
    function emergencyEndGame(uint256 _gameId) external onlyOwner {
        GameRoom storage room = gameRooms[_gameId];
        require(room.isActive, "Game not active");

        room.isActive = false;
        gameFinished[_gameId] = true;

        // Refund stakes to all players
        for (uint256 i = 0; i < room.players.length; i++) {
            payable(room.players[i]).transfer(room.stake);
        }
    }

    /**
     * @dev Withdraw platform fees (only owner)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner).transfer(balance);
    }

    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Fallback function to receive Ether
     */
    receive() external payable {}
}