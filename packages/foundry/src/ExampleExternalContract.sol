// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract ExampleExternalContract {
    bool public completed;

    event Receive(uint256);

    function complete() public payable {
        completed = true;
    }

    receive() external payable {
        emit Receive(msg.value);
    }
}
