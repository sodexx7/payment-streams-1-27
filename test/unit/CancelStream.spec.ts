import { expect,assert } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Streaming } from "../../typechain-types";
const { currentTime } = require("../helpers"); // todo to typescript format

describe("Cancel stream", () => {

    let owner:SignerWithAddress;
    let sender:SignerWithAddress;
    let recipient1:SignerWithAddress;
    let startTimestamp;
    let stopTimestamp;

    let deposit = ethers.utils.parseEther("1");
    let now = currentTime();

    let duration;
    let streamingContract: Streaming;

    beforeEach("#deploy", async () => {
        const Streaming = await ethers.getContractFactory("Streaming");
        [owner, sender, recipient1] = await ethers.getSigners();

        streamingContract = await Streaming.deploy();

        await streamingContract.deployed();
    });

    beforeEach("#setup", async function () {
        duration = 100;
        let delay = 100;

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
                .withArgs(1, sender.address, recipient1.address, deposit, 0);
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