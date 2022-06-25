// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import "../src/Streaming.sol";

contract StreamingTest is Test {
    Streaming streaming;
    // stream params when create
    uint startTimestamp;
    uint stopTimestamp;
    address owner;
    address sender;
    address recipient1;
    address deployed;
    uint immutable delay = 100;
    uint immutable duration = 100;
    uint deposit = 1 ether;

    function setUp() public {
        streaming = new Streaming();
        console.log(address(streaming).balance);
        startTimestamp = block.timestamp + delay;

        stopTimestamp = startTimestamp + duration;
        sender = 0xdEADbB4dDb03b98B88613e1De6F0D95a2CdA15C3;
        recipient1 = 0xdeaDE83461Cc565B6C1722Dabf77241F9FCA9168;
        deployed = address(streaming);
        // 1.deploy streaming
    }

    function testFailcreateStream() public payable {
        // 模拟 sender地址将要调用合约方法，并设置sender地址有10个eth
        vm.expectRevert(); // todo:匹配对应的报错信息

        vm.prank(sender);
        vm.deal(sender, 10 ether);
        // How can you call a payable function in another contract with arguments and send funds?
        //https://ethereum.stackexchange.com/questions/9705/how-can-you-call-a-payable-function-in-another-contract-with-arguments-and-send
        streaming.createStream{value: 1 ether}(
            recipient1,
            2 ether,
            startTimestamp,
            stopTimestamp
        );
    }
}
