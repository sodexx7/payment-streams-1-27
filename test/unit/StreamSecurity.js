const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { currentTime } = require("../helpers");

describe("Stream security check", () => {

    let owner;
    let sender;
    let recipient1, addrs;
    let startTimestamp;
    let stopTimestamp;

    let stream_token_amount = ethers.BigNumber.from("10000000");

    let stream_token_address;
    let streaming_address;
    
    let now = currentTime();
    

    beforeEach("#deploy", async () => {
        // mint STREAM token and send to sender
        StreamToken = await ethers.getContractFactory("StreamToken");
        streamTokenContract = await StreamToken.deploy();

        await streamTokenContract.deployed();
        stream_token_address = await streamTokenContract.address;

        Streaming = await ethers.getContractFactory("Streaming");
        [owner, sender, recipient1, ...addrs] = await ethers.getSigners();

        streamingContract = await Streaming.deploy(stream_token_address);
        await streamingContract.deployed();
        streaming_address = await streamingContract.address;
    });

    beforeEach("#setup", async function () {
         // mint STREAM token and send to sender
         await streamTokenContract.mint(sender.address,stream_token_amount);
         // approve streamingContract using sender's StreamToken 
         await streamTokenContract.connect(sender).approve(streaming_address,stream_token_amount)

        let delay = 100;
        startTimestamp = now + delay;
        stopTimestamp = startTimestamp-1;
    });

    describe("#block time control", function () {

        it("stopTime should after startTime", async function () {
            await expect(
                streamingContract.connect(sender).createStream(recipient1.address, stream_token_amount, startTimestamp,
                    stopTimestamp)
            ).to.be.revertedWith("stopTime before or equal startTime");
        });

    });

   
});