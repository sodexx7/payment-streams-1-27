const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { currentTime } = require("../helpers");

describe("Create Stream", () => {

    let owner;
    let sender;
    let recipient1, addrs;
    let startTimestamp;
    let stopTimestamp;

    let stream_token_amount = ethers.BigNumber.from("10000000");

    
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

        let duration = 100;
        let delay = 100;

        startTimestamp = now + delay;
        stopTimestamp = startTimestamp + duration;

    });

    describe("#reverts", function () {

        it("should fail when the sender have not corresponding enough stream token", async function () {
            await expect(
                streamingContract.connect(sender).createStream(recipient1.address, stream_token_amount.add(100), startTimestamp,
                    stopTimestamp )
            ).to.be.revertedWith("Deposit less than the streaming contract's stream_token allowance for the sender or is equal to zero");
        });

        it("should fail when recipient address is zero-address", async function () {
            await expect(
                streamingContract.connect(sender).createStream(ethers.constants.AddressZero, stream_token_amount, startTimestamp,
                    stopTimestamp )
            ).to.be.revertedWith("Stream to the zero address");
        });

        it("should fail when sender and recipient are same", async function () {
            await expect(
                streamingContract.connect(sender).createStream(sender.address, stream_token_amount, startTimestamp,
                    stopTimestamp )
            ).to.be.revertedWith("Stream to the caller");
        });

        it("should fail when start time has already passed before creation of stream", async function () {
            startTimestamp = now - 1;
            await expect(
                streamingContract.connect(sender).createStream(recipient1.address, stream_token_amount, startTimestamp,
                    stopTimestamp )
            ).to.be.revertedWith("Start time before block timestamp");
        });

        it("should fail when stream_token_amount is not a multiple of duration", async function () {
            let stream_token_amount = (stopTimestamp - startTimestamp) + 1;

            await expect(
                streamingContract.connect(sender).createStream(recipient1.address, stream_token_amount, startTimestamp,
                    stopTimestamp )
            ).to.be.revertedWith("Deposit is not a multiple of time delta");
        });

    });

    describe("#success", function () {
        it("should emit CreateStream event", async function () {
            await expect(
                streamingContract.connect(sender).createStream(recipient1.address, stream_token_amount, startTimestamp,
                    stopTimestamp )
            ).to
                .emit(streamingContract, "CreateStream")
                .withArgs(
                    1, sender.address, recipient1.address, stream_token_amount, startTimestamp, stopTimestamp
                );
        });

    });

    describe("#gasCheck", function () {
        it("should happen within the gas limit", async function () {
            const BASE_GAS_USAGE = 249977 ;// 232_500 old, the add gas mostly is stream_token transfer use ???

            const currentGas = (await streamingContract.connect(sender).estimateGas.createStream(recipient1.address, stream_token_amount, startTimestamp,
                    stopTimestamp)).toNumber();
            console.log(currentGas);
            assert(currentGas < BASE_GAS_USAGE);
            
          });
    });
});