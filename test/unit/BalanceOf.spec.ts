import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Streaming } from "../../typechain-types";
const { currentTime } = require("../helpers"); // todo to typescript format

describe("Balance of stream", () => {
   
    let streamingContract:Streaming;
    let owner:SignerWithAddress;
    let sender:SignerWithAddress;
    let recipient1:SignerWithAddress;
    let startTimestamp;
    let stopTimestamp;

    let deposit = ethers.utils.parseEther("1");

    let duration;

    beforeEach("#deploy", async () => {
        const Streaming = await ethers.getContractFactory("Streaming");
        [owner, sender, recipient1] = await ethers.getSigners();

        streamingContract = await Streaming.deploy();

        await streamingContract.deployed();
    });

    beforeEach("#setup", async function () {
        duration = 100;
        let delay = 100;


        startTimestamp = currentTime() + delay;
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
                streamingContract.balanceOf(invalidStreamId, sender.address)
            ).to.be.revertedWith("stream does not exist");
        });

    });

    describe("#success", function () {

        it("should return 0 balance for address not involved in stream", async function () {
            const otherPartyBalance = await streamingContract.connect(sender).balanceOf(1, owner.address);
            expect(await otherPartyBalance).to.equal(0);
        });

    });

    describe("#gasCheck", function () {
        it("should happen within the gas limit", async function () {
            const BASE_GAS_USAGE = 44_000;

            const currentGas = (await streamingContract.connect(sender).estimateGas.balanceOf(1, recipient1.address)).toNumber();
            expect(await currentGas).to.lt(BASE_GAS_USAGE);
        });
    });

    describe("#privileges check", function () {

        it("should fail when the caller is not recipient or sender", async function () {

            await expect(
                streamingContract.connect(owner).balanceOf(1,recipient1.address)
            ).to.be.revertedWith("caller is not the sender or the recipient of the stream");
        });

    });
});