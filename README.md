
this ba
# payment use hardhat(ts) and foundary template


* 1.src folder add Streaming.sol
* 2.test folder add *.ts
* 3.install @typechain/hardhat @typechain/ethers-v5
```bash
npm install --save-dev @typechain/hardhat @typechain/ethers-v5
```
* 4. if necessary 
```bash
npx hardhat compile 
```
generate typecanin-types



tips
some lib install by forge,if occur some questions check belows:
1.forge install
2.forge remappings > remappings.txt
Whenever you install new libraries using Foundry, make sure to update your remappings.txt file by running forge remappings > remappings.txt. This is required because we use hardhat-preprocessor and the remappings.txt file to allow Hardhat to resolve libraries you install with Foundry.
3.npm install --save-dev @typechain/hardhat @typechain/ethers-v5
4. generate typecanin-types
```bash
npx hardhat clean
npx hardhat compile 
```
4.报错信息处理
npm ERR! Cannot read properties of null (reading 'pickAlgorithm')
npm cache clear --force
5.



foundar 兼容hardhat的操作
1.For automatic Hardhat support you can also pass the --hh flag, which sets the following flags: --lib-paths node_modules --contracts contracts.
forge test 参考
https://github.com/DappCamp-Cohort-3/foundry_starterkit
1.如何设置对应地址的eth value。
2.测试环境的node节点 value 如何设置？

