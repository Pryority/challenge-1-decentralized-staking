// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/Staker.sol";
import "../src/ExampleExternalContract.sol";

contract StakerTest is Test {
    Staker public s;
    ExampleExternalContract public exampleExternalContract;
    address sender;

    event ContractBalance(uint256 amount);
    event ExampleExternalContractBalance(uint256 amount);

    function setUp() public {
        s = new Staker();
        sender = address(this);
    }

    event Stake(address indexed, uint256 amount);

    function test_Stake() public {
        uint256 amount = 1 ether;

        uint256 initialBalance = s.balances(sender);
        s.stake{value: amount}();
        uint256 finalBalance = s.balances(sender);

        assertEq(finalBalance, initialBalance + amount);
    }

    function testFuzz_Stake(uint256 amount) public {
        amount = bound(amount, 0, address(msg.sender).balance);

        uint256 initialBalance = s.balances(sender);
        s.stake{value: amount}();
        uint256 finalBalance = s.balances(sender);

        assertEq(finalBalance, initialBalance + amount);
    }

    function test_Execute() public {
        s.stake{value: 1 ether}();

        // vm.warp(block.timestamp + 30);

        uint256 initialBalance = address(s).balance;
        uint256 initialExternalContractBalance = address(exampleExternalContract).balance;

        s.execute();

        uint256 finalBalance = address(s).balance;
        uint256 finalExternalContractBalance = address(exampleExternalContract).balance;
        emit ContractBalance(finalBalance);
        emit ExampleExternalContractBalance(finalExternalContractBalance);

        assertEq(finalBalance, 0);
        assertEq(finalExternalContractBalance, initialExternalContractBalance + initialBalance);
    }

    function test_TimeLeft() public {
        assertEq(s.timeLeft(), 30);
        
        vm.warp(block.timestamp + 30);

        assertEq(s.timeLeft(), 0);
    }
}
