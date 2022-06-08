// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract Streaming {

    address public owner;
    
    mapping(uint256 => Stream) private streams;
    
    uint64 public streamIdCounter;
    
    modifier onlySenderOrRecipient(uint256 streamId) {
        require(
            msg.sender == streams[streamId].sender || msg.sender == streams[streamId].recipient,
            "caller is not the sender or the recipient of the stream"
        );
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

    event WithdrawFromStream(uint256 indexed streamId, address indexed recipient);
    
    constructor() {
        owner  = msg.sender;
    }
    
    function createStream(
            address recipient,
            uint256 deposit,
            uint256 startTime,
            uint256 stopTime
    ) public payable returns (uint256 streamId) {
        
        require(recipient != address(0x00), "Stream to the zero address");
        require(recipient != address(this), "Stream to the contract itself");
        require(recipient != msg.sender, "Stream to the caller");
        require(deposit > 0, "Deposit is equal to zero");
        require(startTime >= block.timestamp, "Start time before block timestamp");
        
        uint256 duration = stopTime - startTime;
        
        require(deposit >= duration, "Deposit smaller than duration");
        require(deposit % duration == 0, "Deposit is not a multiple of time delta");
        
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
        
        emit CreateStream(currentStreamId, msg.sender, recipient, deposit, startTime, stopTime);
        return currentStreamId;
    }
    
    function balanceOf( uint256 streamId, address who)  public view returns (uint256 balance) {
        Stream memory stream = streams[streamId];
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
        
        
    function elapsedTimeFor(uint256 streamId) private view returns (uint256 delta) {
        Stream memory stream = streams[streamId];
        
        // Before the start of the stream
        if (block.timestamp <= stream.startTime) return 0;
        
        // During the stream
        if (block.timestamp < stream.stopTime) return block.timestamp - stream.startTime;
        
        // After the end of the stream
        return stream.stopTime - stream.startTime;
    }
    
    function withdrawFromStream(
            uint256 streamId
    )  public 
        onlySenderOrRecipient(streamId) {
        uint256 balance = balanceOf(streamId, streams[streamId].recipient);
        require(balance > 0, "Available balance is 0");
        
        payable(streams[streamId].recipient).call{value: balance}("");
        streams[streamId].balance = 0;
        
        emit WithdrawFromStream(streamId, streams[streamId].recipient);
    }

    function getStream(uint256 streamId)
        external
        view
        returns (
            address sender,
            address recipient,
            uint256 deposit,
            uint256 startTime,
            uint256 stopTime,
            uint256 rate
        )
    {
        sender = streams[streamId].sender;
        recipient = streams[streamId].recipient;
        deposit = streams[streamId].deposit;
        startTime = streams[streamId].startTime;
        stopTime = streams[streamId].stopTime;
        rate = streams[streamId].rate;
    }
    
}
