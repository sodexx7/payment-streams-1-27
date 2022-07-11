const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { setTime, currentTime,sleep } = require("../helpers");

describe("Withdraw from stream", () => {

    let owner;
    let sender;
    let recipient1, addrs;
    let startTimestamp;
    let stopTimestamp;

    let deposit = ethers.utils.parseEther("1");
    let now = currentTime();

    let blockSpacing = 1000;
    let duration;

    beforeEach("#deploy", async () => {
        Streaming = await ethers.getContractFactory("Streaming");
        [owner, sender, recipient1, ...addrs] = await ethers.getSigners();

        streamingContract = await Streaming.deploy();

        await streamingContract.deployed();
    
    });

    beforeEach("#setup", async function () {
        duration = 100;
        let delay = 100;

        now = now + blockSpacing;

        startTimestamp = now + delay;
        stopTimestamp = startTimestamp + duration;

        await streamingContract.connect(sender).createStream(
            recipient1.address,
            deposit,
            startTimestamp,
            stopTimestamp,
            { value: deposit }
        );
    });

    describe("#reverts", function () {

        it("should fail when stream doesn't exist", async function () {
            let invalidStreamId = 3;
            await expect(
                streamingContract.withdrawFromStream(invalidStreamId)
            ).to.be.revertedWith("stream does not exist");
        });

   


        it("should available balance is 0 after all balance withrawed", async function () {
            let timeToSet = stopTimestamp + 1;
            await setTime(ethers.provider, timeToSet);
            await streamingContract.connect(recipient1).withdrawFromStream(1)

            await expect(
                streamingContract.connect(recipient1).withdrawFromStream(1)
            ).to.be.revertedWith("Available balance is 0");
        });

        it("should can't call the withdrawFromStream because the stream delete after cancelStream", async function () {
            let timeToSet = startTimestamp + 10;
            await setTime(ethers.provider, timeToSet);
            await streamingContract.connect(recipient1).cancelStream(1)
          
            await expect(
                streamingContract.connect(recipient1).withdrawFromStream(1)
            ).to.be.revertedWith("The caller should be recipient");
        });

        it("should sender's value and recipient1‘s value greater than their init eth value after cancelStream", async function () {
            let timeToSet = startTimestamp + 50;
            await setTime(ethers.provider, timeToSet);
            initSenderEth = await ethers.provider.getBalance(sender.address);
            initRecipient1Eth = await ethers.provider.getBalance(recipient1.address);
            await streamingContract.connect(sender).cancelStream(1)
           
            senderEth = await ethers.provider.getBalance(sender.address);
            recipient1Eth = await ethers.provider.getBalance(recipient1.address);
            expect(senderEth).gt(initSenderEth);
            expect(recipient1Eth).gt(initRecipient1Eth);

            let stream = await streamingContract.connect(recipient1).getStream(1);
            expect(stream.balance).eq(0);
        });

        it("should the stream info did't exists when stream has end and withrawed,and then cancelStream", async function () {
            let timeToSet = stopTimestamp + 1;
            await setTime(ethers.provider, timeToSet);
            
            await streamingContract.connect(recipient1).withdrawFromStream(1);
            await streamingContract.connect(recipient1).cancelStream(1);
            
            let stream = await streamingContract.connect(recipient1).getStream(1);
            expect(stream.deposit.eq(0))
            expect(stream.startTime.eq(0))
            expect(stream.stopTime.eq(0))
            expect(stream.lastWithdrawTime.eq(0))
            
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

        it("LastWithdrawTime should update After Withdraw", async function () {
            let stream = await streamingContract.connect(recipient1).getStream(1);
            let lastWithdrawTime = stream.lastWithdrawTime;

            let timeToSet = stopTimestamp + 1;
            await setTime(ethers.provider, timeToSet);

            streamingContract.connect(recipient1).withdrawFromStream(1)

            let streamAfterWithDraw = await streamingContract.connect(recipient1).getStream(1);
            let lastWithTimedrawAfterWithDraw = streamAfterWithDraw.lastWithdrawTime;

            expect(lastWithTimedrawAfterWithDraw.gt(lastWithdrawTime))
            expect(lastWithTimedrawAfterWithDraw.lt(streamAfterWithDraw.startTime))
        });

        it("should balance less than deposit and greater than zero after withdrawFromStream executed between startTimestamp and stopTimestamp", async function () {
            
            let timeToSet = startTimestamp + 10;
            await setTime(ethers.provider, timeToSet);

            await streamingContract.connect(recipient1).withdrawFromStream(1);
            let stream = await streamingContract.connect(recipient1).getStream(1);
            expect(stream.balance).lt(deposit).gt(0);
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

        it("after multiple withdrawals should have correcct balance", async function () {
            // let timeToSet = startTimestamp + 10;
            // await setTime(ethers.provider, timeToSet);

            let stream0 = await streamingContract.connect(recipient1).getStream(1);
            let stream0Balance = ethers.BigNumber.from(stream0.balance+''); 
            // console.log(stream0Balance)
            let timeToSet = startTimestamp + 10;
            await setTime(ethers.provider, timeToSet);
            await streamingContract.connect(recipient1).withdrawFromStream(1);
            let stream = await streamingContract.connect(recipient1).getStream(1);
            // This look complicated, the reason can look below; if have time, to use more simple and more readably method
            // https://docs.ethers.io/v5/troubleshooting/errors/#help-NUMERIC_FAULT-overflow
            
            let streamBalance = ethers.BigNumber.from(stream.balance+'');
            let minswithDrawBalance1 = ethers.BigNumber.from(stream.rate*10+'');
            expect(streamBalance).lte(stream0Balance.sub(minswithDrawBalance1))
            // console.log(streamBalance.sub(minswithDrawBalance1));


            await sleep(2000);
            await streamingContract.connect(recipient1).withdrawFromStream(1);
            let stream2 = await streamingContract.connect(recipient1).getStream(1);
            let stream2Balance = ethers.BigNumber.from(stream2.balance+'');
            let minswithDrawBalance2 = ethers.BigNumber.from(stream2.rate*2+'');
            expect(stream2Balance).lte(streamBalance.sub(minswithDrawBalance2))
            // console.log(stream2Balance);


            await sleep(2000);
            await streamingContract.connect(recipient1).withdrawFromStream(1);
            let stream3 = await streamingContract.connect(recipient1).getStream(1);
            let stream3Balance = ethers.BigNumber.from(stream3.balance+'');
            let minswithDrawBalance3 = ethers.BigNumber.from(stream3.rate*2+'');
            expect(stream3Balance).lte(stream2Balance.sub(minswithDrawBalance3))
            // console.log(stream3Balance);

        });

    });

    describe("#gasCheck", function () {
        it("should happen within the gas limit", async function () {
            let timeToSet = stopTimestamp + 1;
            await setTime(ethers.provider, timeToSet);

            const BASE_GAS_USAGE = 79882;
            

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