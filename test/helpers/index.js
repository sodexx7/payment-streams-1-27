const setTime = async (provider, timestamp) => {
    await provider.send("evm_mine", [timestamp]);
}

const currentTime = () => {
    let now = new Date();
    return Math.floor(now.getTime() / 1000);
}
const sleep = (ms) =>
  new Promise(resolve => setTimeout(resolve, ms));


module.exports = {
    setTime: setTime,
    currentTime: currentTime,
    sleep:sleep,
}