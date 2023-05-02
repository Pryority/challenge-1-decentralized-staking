// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ExampleExternalContract.sol";

contract Staker {
  ExampleExternalContract public exampleExternalContract;
    mapping(address => uint256) public balances;
    uint256 public constant threshold = 1 ether;
    uint256 public deadline = block.timestamp + 30 seconds;
    uint256 public stakedAmount;
    bool openForWithdraw;

    event Stake(address indexed, uint256 amount);

    constructor() {}

    function timeLeft() public view returns (uint256) {
      if (block.timestamp >= deadline) {
        return 0;
      } else {
        return deadline - block.timestamp;
      }
    }

    function stake() public payable {
        require(msg.value >= 0, "Insufficient amount");
        balances[msg.sender] += msg.value;
        emit Stake(msg.sender, msg.value);
    }

    function execute() public {
        uint256 contractBalance = address(this).balance;
        require(contractBalance >= threshold, "Threshold not reached");

        (bool sent, ) = address(exampleExternalContract).call{value: contractBalance}(abi.encodeWithSignature("complete()"));
        require(sent, "exampleExternalContract.complete failed");
    }
}
