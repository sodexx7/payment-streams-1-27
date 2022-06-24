import { expect,assert } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Streaming } from "../../typechain-types";
const { currentTime } = require("../helpers"); // todo to typescript format

describe("Create Stream", () => {

    let streamingContract: Streaming;
    let owner:SignerWithAddress;
    let sender:SignerWithAddress;
    let recipient1:SignerWithAddress;
    let startTimestamp=0;
    let stopTimestamp=0;

    let deposit = ethers.utils.parseEther("1");
    
    let now = currentTime();

    beforeEach("#deploy", async () => {

        const Streaming = await ethers.getContractFactory("Streaming");
        [owner, sender, recipient1] = await ethers.getSigners();

        streamingContract = await Streaming.deploy();

        await streamingContract.deployed();

    });

    beforeEach("#setup", async function () {
        let duration = 100;
        let delay = 100;

        startTimestamp = now + delay;
        stopTimestamp = startTimestamp + duration;
    });

    describe("#reverts", function () {

        it("should fail when recipient address is zero-address", async function () {
            await expect(
                streamingContract.connect(sender).createStream(ethers.constants.AddressZero, deposit, startTimestamp,
                    stopTimestamp, { value: deposit })
            ).to.be.revertedWith("Stream to the zero address");
        });

        it("should fail when sender and recipient are same", async function () {
            await expect(
                streamingContract.connect(sender).createStream(sender.address, deposit, startTimestamp,
                    stopTimestamp, { value: deposit })
            ).to.be.revertedWith("Stream to the caller");
        });

        it("should fail when deposit is 0", async function () {
            await expect(
                streamingContract.connect(sender).createStream(recipient1.address, 0, startTimestamp,
                    stopTimestamp, { value: 0 })
            ).to.be.revertedWith("Deposit is equal to zero");
        });

        it("should fail when start time has already passed before creation of stream", async function () {
            startTimestamp = now - 1;
            await expect(
                streamingContract.connect(sender).createStream(recipient1.address, deposit, startTimestamp,
                    stopTimestamp, { "value": deposit })
            ).to.be.revertedWith("Start time before block timestamp");
        });

        it("should fail when deposit is not a multiple of duration", async function () {
            let deposit = (stopTimestamp - startTimestamp) + 1;

            await expect(
                streamingContract.connect(sender).createStream(recipient1.address, deposit, startTimestamp,
                    stopTimestamp, { "value": deposit })
            ).to.be.revertedWith("Deposit is not a multiple of time delta");
        });

    });

    describe("#success", function () {
        it("should emit CreateStream event", async function () {
            await expect(
                streamingContract.connect(sender).createStream(recipient1.address, deposit, startTimestamp,
                    stopTimestamp, { "value": deposit })
            ).to
                .emit(streamingContract, "CreateStream")
                .withArgs(
                    1, sender.address, recipient1.address, deposit, startTimestamp, stopTimestamp
                );
        });

    });

    describe("#gasCheck", function () {
        it("should happen within the gas limit", async function () {
            const BASE_GAS_USAGE = 232_500;

            const currentGas = (await streamingContract.connect(sender).estimateGas.createStream(recipient1.address, deposit, startTimestamp,
                    stopTimestamp, { "value": deposit })).toNumber();
            assert(currentGas < BASE_GAS_USAGE);
          });
    });
});