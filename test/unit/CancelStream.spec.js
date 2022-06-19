const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { currentTime } = require("../helpers");

describe("Cancel stream", () => {

    let owner;
    let sender;
    let recipient1, addrs;
    let startTimestamp;
    let stopTimestamp;

    let stream_token_amount = ethers.BigNumber.from("10000000");
    let now = currentTime();

    let duration;

    let stream_token_address;
    let streaming_address;

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

        duration = 100;
        let delay = 100;

        startTimestamp = now + delay;
        stopTimestamp = startTimestamp + duration;

        await streamingContract.connect(sender).createStream(
            recipient1.address,
            stream_token_amount,
            startTimestamp,
            stopTimestamp
        );
    });

    describe("#reverts", function () {

        it("should fail when stream doesn't exist", async function () {
            let invalidStreamId = 3;
            await expect(
                streamingContract.connect(recipient1).cancelStream(invalidStreamId)
            ).to.be.revertedWith("stream does not exist");
        });

        it("should fail when stream has been cancel", async function () {
            
            await streamingContract.connect(recipient1).cancelStream(1)
            
            await expect(
                streamingContract.connect(recipient1).cancelStream(1)
            ).to.be.revertedWith("The stream has been cancel or end");
        });

    });

    describe("#success", function () {

        it("should emit the CancelStream event", async function () {
            await expect(
                streamingContract.connect(recipient1).cancelStream(1)
            ).to
                .emit(streamingContract, "CancelStream")
                .withArgs(1, sender.address, recipient1.address, stream_token_amount, 0);
        });

    });

    describe("#gasCheck", function () {
        it("should happen within the gas limit", async function () {
            const BASE_GAS_USAGE = 88_100;

            const currentGas = (await streamingContract.connect(recipient1).estimateGas.cancelStream(1)).toNumber();
            assert(currentGas < BASE_GAS_USAGE);
        });
    });

    describe("#privileges check", function () {

        it("should fail when the caller is not recipient or sender", async function () {

            await expect(
                streamingContract.connect(owner).cancelStream(1)
            ).to.be.revertedWith("caller is not the sender or the recipient of the stream");
        });

    });
});