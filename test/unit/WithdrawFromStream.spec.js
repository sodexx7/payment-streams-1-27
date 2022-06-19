const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { setTime, currentTime } = require("../helpers");

describe("Withdraw from stream", () => {

    let owner;
    let sender;
    let recipient1, addrs;
    let startTimestamp;
    let stopTimestamp;

    let stream_token_amount = ethers.BigNumber.from("10000000");
    let now = currentTime();

    let blockSpacing = 1000;
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

        now = now + blockSpacing;

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
                streamingContract.withdrawFromStream(invalidStreamId)
            ).to.be.revertedWith("stream does not exist");
        });

        it("should balance less than deposit and greater than zero after withdrawFromStream executed between startTimestamp and stopTimestamp", async function () {
            
            let timeToSet = startTimestamp + 10;
            await setTime(ethers.provider, timeToSet);

            await streamingContract.connect(recipient1).withdrawFromStream(1);
            let stream = await streamingContract.connect(recipient1).getStream(1);
            expect(stream.balance).lt(stream_token_amount).gt(0);
        });

        it("should balance’s calculation based on the new startTimestamp after withdrawFromStream", async function () {
            let timeToSet = startTimestamp + 10;
            await setTime(ethers.provider, timeToSet);

            const beforeBalance =  await streamingContract.connect(recipient1).balanceOf(1,recipient1.address);
            await streamingContract.connect(recipient1).withdrawFromStream(1);
            await setTime(ethers.provider, timeToSet+5);
            const afterBalance =  await streamingContract.connect(recipient1).balanceOf(1,recipient1.address);
            // for the new startTimestamp, the elapsedTime is 5,last startTimestamp Corresponding elapsedTime is 10。
            expect(afterBalance).lt(beforeBalance)
            
        });


        it("should available balance is 0 after all balance withrawed", async function () {
            let timeToSet = stopTimestamp + 1;
            await setTime(ethers.provider, timeToSet);
            await streamingContract.connect(recipient1).withdrawFromStream(1)

            await expect(
                streamingContract.connect(recipient1).withdrawFromStream(1)
            ).to.be.revertedWith("Available balance is 0");
        });

        it("should available balance is 0 after cancelStream", async function () {
            let timeToSet = startTimestamp + 10;
            await setTime(ethers.provider, timeToSet);
            await streamingContract.connect(recipient1).cancelStream(1)
          
            await expect(
                streamingContract.connect(recipient1).withdrawFromStream(1)
            ).to.be.revertedWith("Available balance is 0");
        });

        it("should sender's value and recipient1‘s value greater than their init stream token value after cancelStream", async function () {
            let timeToSet = startTimestamp + 50;
            await setTime(ethers.provider, timeToSet);

            initSenderStreamToken = await streamTokenContract.balanceOf(sender.address);
            initRecipient1StreamToken = await streamTokenContract.balanceOf(recipient1.address);
            await streamingContract.connect(sender).cancelStream(1)
           
            
            senderStreamToken = await streamTokenContract.balanceOf(sender.address);
            recipient1StreamToken = await streamTokenContract.balanceOf(recipient1.address);

            expect(senderStreamToken).gte(initSenderStreamToken);
            expect(recipient1StreamToken).gte(initRecipient1StreamToken);

            let stream = await streamingContract.connect(recipient1).getStream(1);
            expect(stream.balance).eq(0);
        });

        it("should fail when stream has been end and withrawed,and then cancelStream", async function () {
            let timeToSet = stopTimestamp + 1;
            await setTime(ethers.provider, timeToSet);
            
            await streamingContract.connect(recipient1).withdrawFromStream(1)
            await expect(
                
                streamingContract.connect(recipient1).cancelStream(1)
            ).to.be.revertedWith("The stream has been cancel or end");
         
        });

    });

    describe("#success", function () {

        it("should emit the WithdrawFromStream event", async function () {
            let timeToSet = stopTimestamp + 1;
            await setTime(ethers.provider, timeToSet);

            await expect(
                streamingContract.connect(recipient1).withdrawFromStream(1)
            ).to
                .emit(streamingContract, "WithdrawFromStream")
                .withArgs(1, recipient1.address);
        });

    });

    describe("#gasCheck", function () {
        it("should happen within the gas limit", async function () {
            let timeToSet = stopTimestamp + 1;
            await setTime(ethers.provider, timeToSet);

            const BASE_GAS_USAGE = 84_310; // old 58_100

            const currentGas = (await streamingContract.connect(recipient1).estimateGas.withdrawFromStream(1)).toNumber();
            assert(currentGas < BASE_GAS_USAGE);
          });
    });

    describe("#privileges check", function () {

        it("should fail when the caller is not recipient", async function () {

            await expect(
                streamingContract.connect(owner).withdrawFromStream(1)
            ).to.be.revertedWith("The caller should be recipient");
        });

    });
});