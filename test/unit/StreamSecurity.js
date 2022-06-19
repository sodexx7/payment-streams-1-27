const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { currentTime } = require("../helpers");

describe("Stream security check", () => {

    let owner;
    let sender;
    let recipient1, addrs;
    let startTimestamp;
    let stopTimestamp;

    let deposit = ethers.utils.parseEther("1");
    
    let now = currentTime();
    

    beforeEach("#deploy", async () => {
        Streaming = await ethers.getContractFactory("Streaming");
        [owner, sender, recipient1, ...addrs] = await ethers.getSigners();

        streamingContract = await Streaming.deploy();

        await streamingContract.deployed();
    });

    beforeEach("#setup", async function () {
        let delay = 100;
        startTimestamp = now + delay;
        stopTimestamp = startTimestamp-1;
    });

    describe("#block time control", function () {

        it("stopTime should after startTime", async function () {
            await expect(
                streamingContract.connect(sender).createStream(recipient1.address, deposit, startTimestamp,
                    stopTimestamp, { "value": deposit })
            ).to.be.revertedWith("stopTime before or equal startTime");
        });

    });

   
});