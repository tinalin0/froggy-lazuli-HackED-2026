// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SettlementLedger
 * @notice Stores a commitment (hash) to a final settlement and emits an event.
 *         Used with Polygon Amoy testnet (chainId 80002).
 */
contract SettlementLedger {
    struct Settlement {
        bytes32 groupId;
        bytes32 settlementHash;
        string currency;
        uint256 totalCents;
        address committedBy;
        uint256 timestamp;
    }

    mapping(bytes32 => Settlement) public settlements;

    event SettlementCommitted(
        bytes32 indexed settlementId,
        bytes32 indexed groupId,
        bytes32 settlementHash,
        address committedBy,
        uint256 timestamp
    );

    /**
     * @param groupId       keccak256("group:" + groupIdString)
     * @param settlementHash keccak256(canonicalSettlementJsonUtf8)
     * @param currency     e.g. "CAD"
     * @param totalCents   sum of transfer amounts in cents
     * @param participants list of participant addresses (order must match canonical settlement)
     */
    function commitSettlement(
        bytes32 groupId,
        bytes32 settlementHash,
        string calldata currency,
        uint256 totalCents,
        address[] calldata participants
    ) external returns (bytes32 settlementId) {
        settlementId = keccak256(
            abi.encodePacked(groupId, settlementHash, msg.sender, block.timestamp)
        );

        settlements[settlementId] = Settlement({
            groupId: groupId,
            settlementHash: settlementHash,
            currency: currency,
            totalCents: totalCents,
            committedBy: msg.sender,
            timestamp: block.timestamp
        });

        emit SettlementCommitted(
            settlementId,
            groupId,
            settlementHash,
            msg.sender,
            block.timestamp
        );

        // Silence unused parameter warning; participants stored in event / off-chain
        participants;
    }

    function getSettlement(bytes32 settlementId) external view returns (
        bytes32 groupId,
        bytes32 settlementHash,
        string memory currency,
        uint256 totalCents,
        address committedBy,
        uint256 timestamp
    ) {
        Settlement memory s = settlements[settlementId];
        return (
            s.groupId,
            s.settlementHash,
            s.currency,
            s.totalCents,
            s.committedBy,
            s.timestamp
        );
    }
}
