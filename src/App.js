import React, { useState, useEffect } from 'react';
import { ethers, BrowserProvider, Contract, parseEther, formatEther } from 'ethers';

// Replace with your newly deployed contract address
const CONTRACT_ADDRESS = "0x3d768a6f4682de5c4ded6e1bcb554535ea7d767a"; // Update this after deployment
const CONTRACT_ABI = [
	{
		"inputs": [],
		"name": "buyTicket",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "checkAndEndLottery",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_lotteryDuration",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "winner",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "jackpot",
				"type": "uint256"
			}
		],
		"name": "LotteryEnded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "ticketNumber",
				"type": "uint256"
			}
		],
		"name": "TicketPurchased",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "getJackpot",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getLotteryEndTime",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getLotteryRound",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getPlayers",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address payable",
						"name": "playerAddress",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "amount",
						"type": "uint256"
					}
				],
				"internalType": "struct DecentralizedLottery.Player[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getWinner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "jackpot",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "lotteryEndTime",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "lotteryRound",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "players",
		"outputs": [
			{
				"internalType": "address payable",
				"name": "playerAddress",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "winner",
		"outputs": [
			{
				"internalType": "address payable",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [jackpot, setJackpot] = useState('0');
  const [players, setPlayers] = useState([]);
  const [lotteryEndTime, setLotteryEndTime] = useState(0);
  const [lotteryRound, setLotteryRound] = useState(0);
  const [winner, setWinner] = useState(null);
  const [ticketAmount, setTicketAmount] = useState(''); // User input for ticket amount
  const [networkError, setNetworkError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [transactionError, setTransactionError] = useState(null);

  const EXPECTED_CHAIN_ID = 11155111; // Sepolia Testnet

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
      }

      setIsLoading(true);
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();

      if (Number(network.chainId) !== EXPECTED_CHAIN_ID) {
        setNetworkError(`Please switch to Sepolia Testnet (Chain ID: ${EXPECTED_CHAIN_ID})`);
        return;
      }

      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      setProvider(provider);
      setSigner(signer);
      setContract(contract);
      setAccount(address);
      setNetworkError(null);

      await updateLotteryInfo(contract, provider);

      window.ethereum.on('accountsChanged', (accounts) => {
        setAccount(accounts[0] || null);
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

    } catch (error) {
      console.error("Error connecting wallet:", error);
      setTransactionError("Failed to connect wallet: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateLotteryInfo = async (contractInstance, providerInstance) => {
    try {
      if (!contractInstance || !providerInstance) {
        throw new Error("Contract or provider not initialized");
      }
      setIsLoading(true);
      const [pot, playerList, endTime, round, winnerAddress] = await Promise.all([
        contractInstance.getJackpot(),
        contractInstance.getPlayers(),
        contractInstance.getLotteryEndTime(),
        contractInstance.getLotteryRound(),
        contractInstance.getWinner()
      ]);

      const currentBlock = await providerInstance.getBlock('latest');
      const currentTimestamp = currentBlock.timestamp;

      setJackpot(formatEther(pot));
      setPlayers(playerList);
      setLotteryEndTime(Number(endTime));
      setLotteryRound(Number(round));
      setWinner(winnerAddress === '0x0000000000000000000000000000000000000000' ? null : winnerAddress);

      console.log("Current Timestamp:", currentTimestamp);
      console.log("Lottery End Time:", Number(endTime));
      console.log("Is Lottery Active?", currentTimestamp < Number(endTime));
    } catch (error) {
      console.error("Error updating info:", error);
      setTransactionError("Failed to fetch lottery info: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const purchaseTicket = async () => {
    try {
      if (!contract || !provider) {
        setTransactionError("Contract or provider not initialized");
        return;
      }
      if (!ticketAmount || parseFloat(ticketAmount) <= 0) {
        setTransactionError("Please enter a valid ticket amount greater than 0");
        return;
      }

      setIsLoading(true);
      setTransactionError(null);

      const currentBlock = await provider.getBlock('latest');
      const currentTimestamp = currentBlock.timestamp;

      if (currentTimestamp >= lotteryEndTime) {
        throw new Error("Lottery has ended");
      }

      const tx = await contract.buyTicket({
        value: parseEther(ticketAmount),
        gasLimit: 300000
      });

      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Transaction receipt:", receipt);
      alert("Ticket purchased successfully!");
      await updateLotteryInfo(contract, provider);
      setTicketAmount(''); // Clear input after purchase
    } catch (error) {
      console.error("Error buying ticket:", error);
      let errorMsg = "Failed to purchase ticket";
      if (error.code === 4001) {
        errorMsg = "Transaction rejected by user";
      } else if (error.message.includes("Lottery has ended")) {
        errorMsg = "Lottery has ended - please wait for it to reset or end it manually";
      } else if (error.message.includes("insufficient funds")) {
        errorMsg = "Insufficient funds for ticket amount and gas";
      } else {
        errorMsg = `Transaction failed: ${error.message}`;
      }
      setTransactionError(errorMsg);
      alert(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const endLottery = async () => {
    try {
      if (!contract || !provider) {
        setTransactionError("Contract or provider not initialized");
        return;
      }
      setIsLoading(true);
      setTransactionError(null);

      const currentBlock = await provider.getBlock('latest');
      const currentTimestamp = currentBlock.timestamp;

      if (currentTimestamp < lotteryEndTime) {
        throw new Error("Lottery is still running");
      }

      const tx = await contract.checkAndEndLottery({
        gasLimit: 500000 // Increased gas limit due to winner selection and transfer
      });
      console.log("Transaction sent:", tx.hash);
      await tx.wait();
      alert("Lottery ended successfully! New round started with 5-minute deadline.");
      await updateLotteryInfo(contract, provider);
    } catch (error) {
      console.error("Error ending lottery:", error);
      let errorMsg = "Failed to end lottery";
      if (error.message.includes("still running")) {
        errorMsg = "Lottery is still running - wait until the end time";
      } else if (error.message.includes("No players")) {
        errorMsg = "No players in the lottery to end";
      } else {
        errorMsg = `Transaction failed: ${error.message}`;
      }
      setTransactionError(errorMsg);
      alert(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    if (contract && provider) {
      contract.on("TicketPurchased", (player, amount, ticketNumber) => {
        if (mounted) {
          console.log(`Ticket purchased by ${player}, amount: ${formatEther(amount)} ETH, number: ${ticketNumber.toString()}`);
          updateLotteryInfo(contract, provider);
        }
      });

      contract.on("LotteryEnded", (winner, jackpot) => {
        if (mounted) {
          console.log(`Lottery ended. Winner: ${winner}, Jackpot: ${formatEther(jackpot)} ETH`);
          updateLotteryInfo(contract, provider);
        }
      });

      // Auto-check if lottery should end
      const checkLotteryStatus = async () => {
        const currentBlock = await provider.getBlock('latest');
        const currentTimestamp = currentBlock.timestamp;
        if (currentTimestamp >= lotteryEndTime && players.length > 0) {
          await endLottery();
        }
      };

      const interval = setInterval(checkLotteryStatus, 30000); // Check every 30 seconds

      return () => {
        mounted = false;
        clearInterval(interval);
        if (contract) {
          contract.removeAllListeners("TicketPurchased");
          contract.removeAllListeners("LotteryEnded");
        }
      };
    }
  }, [contract, provider, lotteryEndTime, players]);

  return (
    <div style={{ padding: '20px' }}>
      {!account ? (
        <button onClick={connectWallet} disabled={isLoading}>
          {isLoading ? "Connecting..." : "Connect Wallet"}
        </button>
      ) : (
        <div>
          {networkError && <p style={{ color: 'red' }}>{networkError}</p>}
          {transactionError && <p style={{ color: 'red' }}>{transactionError}</p>}
          <p>Connected Account: {account}</p>
          <p>Round: {lotteryRound}</p>
          <p>Jackpot: {jackpot} Sepolia ETH</p>
          <p>End Time: {new Date(lotteryEndTime * 1000).toLocaleString()}</p>

          <div>
            <input
              type="number"
              value={ticketAmount}
              onChange={(e) => setTicketAmount(e.target.value)}
              placeholder="Enter ticket amount (ETH)"
              step="0.01"
              min="0.01"
              style={{ marginRight: '10px' }}
            />
            <button
              onClick={purchaseTicket}
              disabled={isLoading || networkError}
            >
              {isLoading ? "Processing..." : "Buy Ticket"}
            </button>
          </div>

          <h3>Players in Round {lotteryRound}</h3>
          {players.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid black', padding: '8px' }}>Wallet Address</th>
                  <th style={{ border: '1px solid black', padding: '8px' }}>Amount (Sepolia ETH)</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player, index) => (
                  <tr key={index}>
                    <td style={{ border: '1px solid black', padding: '8px' }}>{player.playerAddress}</td>
                    <td style={{ border: '1px solid black', padding: '8px' }}>{formatEther(player.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No players yet in this round.</p>
          )}

          {winner && (
            <p style={{ marginTop: '20px', color: 'green' }}>
              Round {lotteryRound - 1} Winner: {winner} received {jackpot} Sepolia ETH!
            </p>
          )}

          <button
            onClick={endLottery}
            disabled={isLoading || networkError}
            style={{ marginTop: '20px' }}
          >
            {isLoading ? "Processing..." : "End Lottery Now"}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;