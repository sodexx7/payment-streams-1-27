const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { currentTime } = require("../helpers");

describe("Balance of StreamToken", () => {

    let owner;
    let sender;
    let recipient1, addrs;

    let stream_token_amount = ethers.BigNumber.from("10000000");
   

    beforeEach("#deploy", async () => {
        StreamToken = await ethers.getContractFactory("StreamToken");
        [owner, sender, recipient1, ...addrs] = await ethers.getSigners();

        streamTokenContract = await StreamToken.deploy();

        await streamTokenContract.deployed();
    });

    beforeEach("#setup", async function () {


        await streamTokenContract.connect(owner).mint(sender.address,stream_token_amount);
    });

    describe("#success", function () {

        it("should sender's stream token amount equals stream_token_amount", async function () {
            const senderBalance = await streamTokenContract.connect(sender).balanceOf(sender.address);
            assert(senderBalance.eq(stream_token_amount));
        });

    });
});