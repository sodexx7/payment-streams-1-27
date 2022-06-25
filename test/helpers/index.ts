const hre = require("hardhat");
import { BigNumber,ethers } from "ethers";


   
function currentTime() {
    let now = new Date();
    return Math.floor(now.getTime() / 1000);
}

async function setTime(timestamp:BigNumber) {
    await hre.network.provider.send("evm_increaseTime", [timestamp]);
    
} 
  
module.exports = {
    setTime: setTime,
    currentTime: currentTime
}







