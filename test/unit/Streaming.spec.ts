const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Streaming } from "../../typechain-types";
const { currentTime } = require("../helpers"); // todo to typescript format

describe("Deployment", () => {

    let owner:SignerWithAddress;
    let streamingContract: Streaming;

    beforeEach("#deploy", async () => {
        const Streaming = await ethers.getContractFactory("Streaming");
        [owner] = await ethers.getSigners();
       

        streamingContract = await Streaming.deploy();

        await streamingContract.deployed();
    });

    describe("#success", function () {

        describe("Deployment", function () {
            it("Should set the right owner", async function () {
                expect(await streamingContract.owner()).to.equal(owner.address);
            });
        });

    });
});