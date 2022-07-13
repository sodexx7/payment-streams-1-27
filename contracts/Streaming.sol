// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./StreamToken.sol";

contract Streaming {
    uint64 public streamIdCounter;
    address public _stream_token_address;

    address stream_coin_token_address;
    StreamToken immutable stream_token;

    mapping(uint64 => Stream) private streams;

    modifier onlySenderOrRecipient(uint64 streamId) {
        require(
            msg.sender == streams[streamId].sender ||
                msg.sender == streams[streamId].recipient,
            "caller is not the sender or the recipient of the stream"
        );
        _;
    }
    modifier onlyExistSream(uint64 streamId) {
        require(streamId <= streamIdCounter, "stream does not exist");
        _;
    }

    struct Stream {
        address recipient;
        address sender;
        uint256 deposit;
        uint256 startTime;
        uint256 stopTime;
        uint256 lastWithdrawTime;
        uint256 rate;
        uint256 balance;
    }

    event CreateStream(
        uint64 indexed streamId,
        address indexed sender,
        address indexed recipient,
        uint256 deposit,
        uint256 startTime,
        uint256 stopTime
    );

    event WithdrawFromStream(
        uint64 indexed streamId,
        address indexed recipient
    );

    event CancelStream(
        uint64 indexed streamId,
        address indexed sender,
        address indexed recipient,
        uint256 vestedAmount,
        uint256 remainingAmount
    );

    constructor(address _stream_coin_token_address) {
        _stream_token_address = msg.sender;
        // deployed stream contract,set the stream_token.
        stream_token = StreamToken(_stream_coin_token_address);
    }

    function createStream(
        address recipient,
        uint256 deposit,
        uint256 startTime,
        uint256 stopTime
    ) external payable returns (uint64 streamId) {
        require(
            deposit <= stream_token.allowance(msg.sender, address(this)) &&
                deposit > 0,
            "Deposit less than the streaming contract's stream_token allowance for the sender or is equal to zero "
        );
        require(recipient != address(0x00), "Stream to the zero address");
        require(recipient != address(this), "Stream to the contract itself");
        require(recipient != msg.sender, "Stream to the caller");

        require(
            startTime >= block.timestamp,
            "Start time before block timestamp"
        );

        require(stopTime > startTime, "stopTime before or equal startTime");

        uint256 duration = stopTime - startTime;

        require(deposit >= duration, "Deposit smaller than duration");
        require(
            deposit % duration == 0,
            "Deposit is not a multiple of time delta"
        );

        streamIdCounter += 1;
        uint64 currentStreamId = streamIdCounter;

        // Rate Per second
        uint256 rate = deposit / duration;

        streams[currentStreamId] = Stream({
            balance: deposit,
            deposit: deposit,
            rate: rate,
            recipient: recipient,
            sender: msg.sender,
            startTime: startTime,
            stopTime: stopTime,
            lastWithdrawTime: 0
        });

        emit CreateStream(
            currentStreamId,
            msg.sender,
            recipient,
            deposit,
            startTime,
            stopTime
        );

        // transfer Stream token todo:if the below code execute wrongly,what's the situation?  can use tendarly test.
        bool success = stream_token.transferFrom(
            msg.sender,
            address(this),
            deposit
        );
        require(success);

        return currentStreamId;
    }

    function balanceOf(uint64 streamId, address who)
        public
        view
        onlyExistSream(streamId)
        onlySenderOrRecipient(streamId)
        returns (uint256 balance)
    {
        Stream memory stream = streams[streamId];
        // if no balance,return 0,skip the next steps
        if (stream.balance == 0) {
            return 0;
        }
        uint256 elapsedTime = elapsedTimeFor(streamId);
        uint256 due = elapsedTime * stream.rate;

        if (who == stream.recipient) {
            return due;
        } else if (who == stream.sender) {
            return stream.balance - due;
        } else {
            return 0;
        }
    }

    function elapsedTimeFor(uint64 streamId)
        private
        view
        onlyExistSream(streamId)
        returns (uint256 delta)
    {
        Stream memory stream = streams[streamId];

        // Before the start of the stream
        if (block.timestamp <= stream.startTime) return 0;

        // During the stream
        if (block.timestamp < stream.stopTime)
            return block.timestamp - stream.startTime;

        // After the end of the stream
        return stream.stopTime - stream.startTime;
    }

    function withdrawFromStream(uint64 streamId)
        external
        onlyExistSream(streamId)
    {
        // check  Recipient
        require(
            msg.sender == streams[streamId].recipient,
            "The caller should be recipient"
        );
        Stream storage stream_this = streams[streamId];

        uint256 balance = balanceOf(streamId, msg.sender);
        require(balance > 0, "Available balance is 0");

        stream_this.balance -= balance;
        stream_this.lastWithdrawTime = stream_this.startTime;
        stream_this.startTime = block.timestamp;

        bool success = stream_token.transfer(
            streams[streamId].recipient,
            balance
        );
        require(success);

        emit WithdrawFromStream(streamId, streams[streamId].recipient);
    }

    function getStream(uint64 streamId)
        public
        view
        onlyExistSream(streamId)
        returns (
            address sender,
            address recipient,
            uint256 deposit,
            uint256 balance,
            uint256 startTime,
            uint256 stopTime,
            uint256 lastWithdrawTime,
            uint256 rate
        )
    {
        Stream memory stream = streams[streamId];
        return (
            stream.sender,
            stream.recipient,
            stream.deposit,
            stream.balance,
            stream.startTime,
            stream.stopTime,
            stream.lastWithdrawTime,
            stream.rate
        );
    }

    function cancelStream(uint64 streamId)
        external
        onlyExistSream(streamId)
        onlySenderOrRecipient(streamId)
    {
        // check state
        // 1）validate streamId
        // 2) validate sender or recipent
        // 3)check stream cancel or end? through by the banlance( sender and recipient)
        Stream memory stream_this = streams[streamId];
        address sender = stream_this.sender;
        address recipient = stream_this.recipient;
        uint256 vestedAmount = balanceOf(streamId, sender);

        uint256 remainingAmount = balanceOf(streamId, recipient);

        delete streams[streamId];

        if (vestedAmount > 0) {
            bool success = stream_token.transfer(sender, vestedAmount);
            require(success);
        }
        if (remainingAmount > 0) {
            bool success = stream_token.transfer(recipient, remainingAmount);
            require(success);
        }

        emit CancelStream(
            streamId,
            sender,
            recipient,
            vestedAmount,
            remainingAmount
        );
    }
}
