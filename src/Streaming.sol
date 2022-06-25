// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract Streaming {
    address public owner;

    mapping(uint256 => Stream) private streams;

    uint64 public streamIdCounter;

    modifier onlySenderOrRecipient(uint256 streamId) {
        require(
            msg.sender == streams[streamId].sender ||
                msg.sender == streams[streamId].recipient,
            "caller is not the sender or the recipient of the stream"
        );
        _;
    }
    modifier onlyValidateSreamId(uint256 streamId) {
        require(streamId <= streamIdCounter, "stream does not exist");
        _;
    }

    struct Stream {
        address recipient;
        address sender;
        uint256 deposit;
        uint256 startTime;
        uint256 stopTime;
        uint256 rate;
        uint256 balance;
    }

    event CreateStream(
        uint256 indexed streamId,
        address indexed sender,
        address indexed recipient,
        uint256 deposit,
        uint256 startTime,
        uint256 stopTime
    );

    event WithdrawFromStream(
        uint256 indexed streamId,
        address indexed recipient
    );

    event CancelStream(
        uint256 indexed streamId,
        address indexed sender,
        address indexed recipient,
        uint256 vestedAmount,
        uint256 remainingAmount
    );

    constructor() {
        owner = msg.sender;
    }

    function createStream(
        address recipient,
        uint256 deposit,
        uint256 startTime,
        uint256 stopTime
    ) external payable returns (uint256 streamId) {
        require(
            deposit == msg.value,
            "Please input the deposit equals your transfer amount"
        );
        require(recipient != address(0x00), "Stream to the zero address");
        require(recipient != address(this), "Stream to the contract itself");
        require(recipient != msg.sender, "Stream to the caller");

        require(deposit > 0, "Deposit is equal to zero");
        require(
            startTime >= block.timestamp,
            "Start time before block timestamp"
        );

        uint256 duration = stopTime - startTime;

        require(deposit >= duration, "Deposit smaller than duration");
        require(
            deposit % duration == 0,
            "Deposit is not a multiple of time delta"
        );

        streamIdCounter += 1;
        uint256 currentStreamId = streamIdCounter;

        // Rate Per second
        uint256 rate = deposit / duration;

        streams[currentStreamId] = Stream({
            balance: deposit,
            deposit: deposit,
            rate: rate,
            recipient: recipient,
            sender: msg.sender,
            startTime: startTime,
            stopTime: stopTime
        });

        emit CreateStream(
            currentStreamId,
            msg.sender,
            recipient,
            deposit,
            startTime,
            stopTime
        );
        return currentStreamId;
    }

    function balanceOf(uint256 streamId, address who)
        public
        view
        onlyValidateSreamId(streamId)
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

    function elapsedTimeFor(uint256 streamId)
        private
        view
        onlyValidateSreamId(streamId)
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

    function withdrawFromStream(uint256 streamId)
        external
        onlyValidateSreamId(streamId)
    {
        // check  Recipient
        require(
            msg.sender == streams[streamId].recipient,
            "The caller should be recipient"
        );

        uint256 balance = balanceOf(streamId, msg.sender);
        require(balance > 0, "Available balance is 0");

        streams[streamId].balance -= balance;
        streams[streamId].startTime = block.timestamp;
        (bool success, ) = payable(streams[streamId].recipient).call{
            value: balance
        }("");
        require(success);

        emit WithdrawFromStream(streamId, streams[streamId].recipient);
    }

    function getStream(uint256 streamId)
        public
        view
        onlyValidateSreamId(streamId)
        returns (
            address sender,
            address recipient,
            uint256 deposit,
            uint256 balance,
            uint256 startTime,
            uint256 stopTime,
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
            stream.rate
        );
    }

    function cancelStream(uint256 streamId)
        external
        onlyValidateSreamId(streamId)
        onlySenderOrRecipient(streamId)
    {
        // check state
        // 1）validate streamId
        // 2) validate sender or recipent
        // 3)check stream cancel or end? through by the banlance( sender and recipient)
        address sender;
        address recipient;
        (sender, recipient, , , , , ) = getStream(streamId);
        uint256 vestedAmount = balanceOf(streamId, sender);

        uint256 remainingAmount = balanceOf(
            streamId,
            streams[streamId].recipient
        );

        if (vestedAmount == 0 && remainingAmount == 0) {
            revert("The stream has been cancel or end");
        }

        streams[streamId].balance = 0;

        if (vestedAmount > 0) {
            (bool success, ) = payable(recipient).call{value: vestedAmount}("");
            require(success);
        }
        if (remainingAmount > 0) {
            (bool success, ) = payable(sender).call{value: remainingAmount}("");
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
