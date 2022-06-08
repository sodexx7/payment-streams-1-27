# Payment Streams

### Introduction

Imagine if payments could be made every millisecond instead of being sent at the end of a week or a month or a quarter. `Payment Streams` allows users to stream funds to another account. 

### Requirements

- Developer sets up a payment streaming smart contract

- A payer (Sender), creates a stream by depositing funds in the contract and chooses a streaming duration.

- A payee (Recipient), can withdraw money from stream equivalent to the amount of money streamed since stream creation

- The stream can be terminated by either the sender or recipient

- The sender or recipient can check the balance in the stream at any time

### Setup

Setup of this project requires [Node](https://nodejs.org/en/) and [Hardhat](https://hardhat.org/getting-started/#installation) installed

-   Clone this repo and switch to the repo directory

-   Install dependencies

    ```
    npm install
    ```

-   Run the initial set of tests

    ```
    npx hardhat test
    ```

### Tasks

In this assignment we have already implemented a few functionalities for you like creating a stream, withdrawing from stream or checking its balance. These implementations can be incorrect and un-optimised. Complete the following tasks in `contracts/Streaming.sol` contract

- Fix functional errors with this smart contract, if any. These errors include functions that do not behave as intended

    Hint: Check if `withdrawFromStream` function behaves as expected

- Add another function `cancelStream`. This function should take in the `streamId` and return the vested amount until that time to recipient and the remaining to sender

- Fix security issues. These may include but are not limited to

    - Function visibility

    - Re-entrancy

    - Unexpected ether

- Make gas optimisations to pass tests under `test/unit` directory. These tests are labelled as `#gasCheck`

- Write tests to verify the following

    - Added features and functionality

    - Security issues that you have fixed

### Optional Task

- Create another branch for optional task

- Create an ERC20 token named `STREAM`, and convert streaming contract to transact using `STREAM` token instead of ether

- Modify tests to verify the transfer of ERC20 tokens

## Submission

-   Create a new branch with your name. You can use the following command

    ```
    git checkout -b my-name
    ```

-   Make required changes

-   Pushing code to this branch must trigger a pipeline to run yours tests automatically

-   Create a pull request from your branch to main branch of original repo


### Notes

- Make any required assumptions