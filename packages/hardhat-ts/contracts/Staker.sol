// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Stake {
  mapping(address => uint256) balances;
  uint256 public constant threshold = 1 ether;
  uint256 public deadline = block.timestamp + 30 seconds;
}
