const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

describe("Deployment", () => {

    let owner;
    let stream_token_address;

    beforeEach("#deploy", async () => {

        StreamToken = await ethers.getContractFactory("StreamToken");
        streamTokenContract = await StreamToken.deploy();

        await streamTokenContract.deployed();
        stream_token_address = await streamTokenContract.address;


        Streaming = await ethers.getContractFactory("Streaming");
        [owner] = await ethers.getSigners();

        streamingContract = await Streaming.deploy(stream_token_address);

        await streamingContract.deployed();
    });

    describe("#success", function () {

        describe("Deployment", function () {
            it("Should set the right owner", async function () {
                expect(await streamingContract._stream_token_address()).to.equal(owner.address);
            });
        });

    });
});