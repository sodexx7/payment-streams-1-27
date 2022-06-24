##how to change *.js in test to *.ts in test

-   Install tyepchain

https://www.npmjs.com/package/@typechain/hardhat

    ```
    npm install --save-dev @typechain/hardhat @typechain/ethers-v5
    ```

-    change hardhat.config.js to hardhat.config.ts and add below

    ```
    import '@typechain/hardhat'
    import '@nomiclabs/hardhat-ethers'
    import '@nomiclabs/hardhat-waffle'
    ```

- add tsconfig.json
    below is example

    ```
    {
    "compilerOptions": {
        "target": "es2018",
        "module": "commonjs",
        "strict": true,
        "esModuleInterop": true,
        "outDir": "dist",
        "resolveJsonModule": true
    },
    "include": ["./scripts", "./test", "./typechain-types"],
    "files": ["./hardhat.config.ts"]
    }
    ```

Now typings should be automatically generated each time contract recompilation happens.
Warning: before running it for the first time you need to do hardhat clean, otherwise TypeChain will think that there is no need to generate any typings. This is because this plugin will attempt to do incremental generation and generate typings only for changed contracts. You should also do hardhat clean if you change any TypeChain related config option.


- change *.js to *.ts in test
some tips:
    1.change the blocktime:
        await ethers.provider.send("evm_mine", [timeToSet]);


 todo
 1.const { currentTime } = require("../helpers"); // todo to typescript format
 2.optimation function: extract below function
    await ethers.provider.send("evm_mine", [timeToSet]);