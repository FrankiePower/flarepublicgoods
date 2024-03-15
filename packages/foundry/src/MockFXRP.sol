// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockFXRP
 * @notice Mock FXRP token for testing on Coston2
 * @dev Simple ERC-20 with public faucet functionality
 */
contract MockFXRP is ERC20 {
    uint256 public constant FAUCET_AMOUNT = 1000 * 10**18; // 1000 FXRP per claim
    uint256 public constant COOLDOWN_TIME = 1 hours; // Cooldown between claims

    mapping(address => uint256) public lastClaimTime;

    event FaucetClaim(address indexed user, uint256 amount);

    constructor() ERC20("Mock FXRP", "MFXRP") {
        // Mint initial supply to deployer for distribution
        _mint(msg.sender, 1_000_000 * 10**18); // 1M FXRP
    }

    /**
     * @notice Claim test FXRP tokens from faucet
     * @dev Users can claim 1000 FXRP once per hour
     */
    function faucet() external {
        require(
            block.timestamp >= lastClaimTime[msg.sender] + COOLDOWN_TIME,
            "MockFXRP: Cooldown period not elapsed"
        );

        lastClaimTime[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);

        emit FaucetClaim(msg.sender, FAUCET_AMOUNT);
    }

    /**
     * @notice Check time until next faucet claim
     * @param user Address to check
     * @return Time in seconds until next claim (0 if can claim now)
     */
    function timeUntilNextClaim(address user) external view returns (uint256) {
        uint256 nextClaimTime = lastClaimTime[user] + COOLDOWN_TIME;
        if (block.timestamp >= nextClaimTime) {
            return 0;
        }
        return nextClaimTime - block.timestamp;
    }

    /**
     * @notice Check if user can claim from faucet
     * @param user Address to check
     * @return True if user can claim
     */
    function canClaim(address user) external view returns (bool) {
        return block.timestamp >= lastClaimTime[user] + COOLDOWN_TIME;
    }
}
