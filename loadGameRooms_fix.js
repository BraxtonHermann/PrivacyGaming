// Fixed loadGameRooms function
async function loadGameRooms() {
    try {
        if (contract && provider) {
            // Check if contract is actually deployed
            try {
                const code = await provider.getCode(CONTRACT_ADDRESS);
                if (code !== '0x') {
                    console.log('Contract found, loading from blockchain...');
                    const activeGames = await contract.getActiveGames();
                    if (activeGames && activeGames[0] && activeGames[0].length > 0) {
                        console.log('Loaded', activeGames[0].length, 'games from blockchain');
                        // Convert the tuple array format to our expected format
                        const games = activeGames[0].map((gameId, index) => ({
                            gameId: Number(gameId),
                            name: activeGames[1][index],
                            gameType: activeGames[2][index],
                            maxPlayers: activeGames[3][index],
                            currentPlayers: activeGames[4][index],
                            difficulty: activeGames[5][index],
                            stake: activeGames[6][index],
                            creator: activeGames[7][index],
                            isActive: activeGames[8][index]
                        }));
                        displayGameRooms(games);
                        return;
                    }
                } else {
                    console.log('Contract not deployed, using preset games');
                    showAlert('Contract not deployed - using demo games for testing', 'error');
                }
            } catch (contractError) {
                console.log('Contract error:', contractError.message);
                showAlert('Contract call failed - using demo games', 'error');
            }
        }
        // Always fallback to preset games
        console.log('Using preset games');
        displayGameRooms(presetGames);
    } catch (error) {
        console.error('Error loading game rooms:', error);
        console.log('Falling back to preset games');
        showAlert('Unable to load games - using preset games', 'error');
        displayGameRooms(presetGames);
    }
}

// Fixed createGameRoom function
async function createGameRoom(name, gameType, maxPlayers, difficulty, stake) {
    try {
        if (!contract) {
            showAlert('Contract not available - this is a demo. Connect wallet and deploy contract for full functionality.', 'error');
            return;
        }

        // Check if contract exists
        const code = await provider.getCode(CONTRACT_ADDRESS);
        if (code === '0x') {
            showAlert('Contract not deployed. Deploy the Privacy Gaming contract first.', 'error');
            return;
        }

        const stakeInWei = ethers.parseEther(stake.toString());

        const tx = await contract.createGameRoom(name, gameType, maxPlayers, difficulty, stakeInWei);
        showAlert('Transaction submitted. Creating game room...', 'success');

        const receipt = await tx.wait();
        showAlert('Game room created successfully!', 'success');

        document.getElementById('createGameForm').reset();

        setTimeout(async () => {
            await loadGameRooms();
        }, 2000);
    } catch (error) {
        console.error('Error creating game room:', error);
        let errorMsg = 'Failed to create game room: ';

        if (error.message.includes('user rejected')) {
            errorMsg += 'Transaction cancelled by user';
        } else if (error.message.includes('insufficient funds')) {
            errorMsg += 'Insufficient funds for transaction';
        } else if (error.message.includes('execution reverted')) {
            errorMsg += 'Contract execution failed. Check parameters.';
        } else {
            errorMsg += 'Contract not available. This is demo mode.';
        }

        showAlert(errorMsg, 'error');
    }
}

// Fixed joinGameRoom function
async function joinGameRoom() {
    try {
        if (!selectedJoinMethod || !selectedPrivacy) {
            throw new Error('Please select join method and privacy level');
        }
        if (!currentGameId) {
            throw new Error('No game room selected');
        }

        if (!contract) {
            showAlert('Contract not available - this is a demo. Deploy contract for real gameplay.', 'error');
            resetJoinForm();
            return;
        }

        // Check if contract exists
        const code = await provider.getCode(CONTRACT_ADDRESS);
        if (code === '0x') {
            showAlert('Contract not deployed. This is demo mode only.', 'error');
            resetJoinForm();
            return;
        }

        const game = presetGames.find(g => g.gameId === currentGameId);
        if (!game) throw new Error('Game room not found');

        const isAnonymous = selectedJoinMethod === 'anonymous';
        const maxPrivacy = selectedPrivacy === 'maximum';

        console.log('Joining game room:', currentGameId);
        console.log('Stake:', ethers.formatEther(game.stake), 'ETH');
        console.log('Anonymous:', isAnonymous);
        console.log('Max privacy:', maxPrivacy);

        const tx = await contract.joinGameRoom(
            currentGameId,
            isAnonymous,
            maxPrivacy,
            { value: game.stake }
        );

        showAlert('Join transaction submitted. Entering game room...', 'success');
        console.log('Transaction hash:', tx.hash);

        await tx.wait();
        showAlert(`Successfully joined game room #${currentGameId}!${isAnonymous ? ' (Anonymous mode with FHE)' : ''}`, 'success');

        resetJoinForm();
        setTimeout(async () => {
            await loadGameRooms();
        }, 2000);

    } catch (error) {
        console.error('Error joining game room:', error);
        let errorMsg = 'Failed to join game room: ';

        if (error.message.includes('user rejected')) {
            errorMsg += 'Transaction cancelled by user';
        } else if (error.message.includes('insufficient funds')) {
            errorMsg += 'Insufficient funds for stake amount';
        } else if (error.message.includes('execution reverted')) {
            errorMsg += 'Game room may be full or inactive';
        } else if (error.message.includes('Please select')) {
            errorMsg += error.message;
        } else {
            errorMsg += 'Contract not available. This is demo mode.';
        }

        showAlert(errorMsg, 'error');
    }
}