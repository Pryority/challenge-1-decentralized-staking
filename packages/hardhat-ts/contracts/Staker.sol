pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

import 'hardhat/console.sol';
import './ExampleExternalContract.sol';

contract Staker {
  ExampleExternalContract public exampleExternalContract;
  mapping(address => uint256) public balances;
  uint256 public constant threshold = 0.0025 ether;
  uint256 public totalStaked;
  uint256 public deadline;
  bool public isDeadline;
  bool public openForWithdraw;

  event Stake(address indexed from, uint256 amount);
  event Withdraw(address indexed from, uint256 amount);

  constructor(address _exampleExternalContract) public {
    exampleExternalContract = ExampleExternalContract(_exampleExternalContract);
    isDeadline = true;
    openForWithdraw = false;
    deadline = 0;
  }

  // TODO: Collect funds in a payable `stake()` function and track individual `balances` with a mapping:
  //  ( make sure to add a `Stake(address,uint256)` event and emit it for the frontend <List/> display )
  function stake() public payable {
    // require(msg.value >= threshold, 'Balance does not exceed minimum stake amount');
    openForWithdraw = true;
    balances[msg.sender] += msg.value;
    totalStaked += msg.value;
    if (totalStaked >= threshold) {
      openForWithdraw = false;
    }
    emit Stake(msg.sender, msg.value);
    isDeadline = true;
    deadline = block.timestamp + 10 seconds;
  }

  function execute() public {
    uint256 amount = address(this).balance;
    require(amount == totalStaked, 'Staker balance not equal to totalStaked');
    require(amount >= threshold, 'Threshold not yet reached');
    require(isDeadline == true, 'Deadline has not yet been set');
    require(block.timestamp >= deadline, 'Deadline has not expired');
    exampleExternalContract.complete{value: address(this).balance}();
    totalStaked -= amount;
    balances[msg.sender] = totalStaked;
  }

  // TODO: if the `threshold` was not met, allow everyone to call a `withdraw()` function
  function withdraw() public {
    uint256 amount = balances[msg.sender];
    require(msg.sender.balance >= amount, 'Not enough ETH');
    require(amount > 0, 'Not enough ETH');
    require(totalStaked < threshold, 'Total staked has exceeded the threshold');
    require(block.timestamp >= deadline, 'Deadline has not expired');
    payable(msg.sender).transfer(amount);
    balances[msg.sender] = 0;
    totalStaked -= amount;
    emit Withdraw(msg.sender, amount);
  }

  // TODO: Add a `timeLeft()` view function that returns the time left before the deadline for the frontend
  function timeLeft() public view returns (uint256) {
    require(isDeadline == true, 'Deadline has not been set');
    if (block.timestamp >= deadline) {
      return 0;
    } else {
      return deadline - block.timestamp;
    }
  }

  // TODO: Add the `receive()` special function that receives eth and calls stake()
  receive() external payable {
    stake();
  }
}
