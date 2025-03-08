// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DecentralizedLottery {
    
    address public owner;
    uint256 public ticketPrice;
    uint256 public lotteryEndTime;
    address payable[] public players;
    address payable public winner;
    uint256 public jackpot;
    uint256 public lotteryRound;

    
    event TicketPurchased(address indexed player, uint256 ticketNumber);
    event LotteryEnded(address winner, uint256 jackpot);

  
    constructor(uint256 _ticketPrice, uint256 _lotteryDuration) {
        owner = msg.sender;
        ticketPrice = _ticketPrice;
        lotteryEndTime = block.timestamp + _lotteryDuration;
        lotteryRound = 1;
    }

    
    function buyTicket() public payable {
        require(block.timestamp < lotteryEndTime, "Lottery has ended");
        require(msg.value == ticketPrice, "Incorrect ticket price");
        players.push(payable(msg.sender));
        jackpot += msg.value;
        emit TicketPurchased(msg.sender, players.length - 1);
    }

    function endLottery() public {
        require(block.timestamp >= lotteryEndTime, "Lottery is still running");
        require(msg.sender == owner, "Only the owner can end the lottery");
        require(players.length > 0, "No players in the lottery");

        winner = selectWinner();
        if (address(winner) != address(0)) {
            winner.transfer(jackpot);
            emit LotteryEnded(winner, jackpot);
        }

        resetLottery();
    }

    function selectWinner() private view returns (address payable) {
        if (players.length == 0) {
            return payable(address(0)); 
        }
        uint256 randomIndex = uint256(keccak256(abi.encodePacked(block.timestamp, players, lotteryRound))) % players.length;
        return players[randomIndex];
    }

    function resetLottery() private {
        players = new address payable[](0);
        jackpot = 0;
        lotteryEndTime = block.timestamp + 1 minutes;
        lotteryRound++;
    }

    function getPlayers() public view returns (address payable[] memory){
        return players;
    }

    function getLotteryEndTime() public view returns (uint256){
        return lotteryEndTime;
    }
    function getTicketPrice() public view returns (uint256){
        return ticketPrice;
    }
    function getJackpot() public view returns (uint256){
        return jackpot;
    }
    function getLotteryRound() public view returns (uint256){
        return lotteryRound;
    }

}