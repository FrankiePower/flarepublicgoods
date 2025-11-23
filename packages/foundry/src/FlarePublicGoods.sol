// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IRandomNumberV2 {
    function getRandomNumber() external view returns (uint256 randomNumber, bool isSecureRandom, uint256 randomTimestamp);
}

interface IFtsoV2 {
    function getFeedByIdInWei(bytes21 feedId) external payable returns (uint256 value, uint64 timestamp);
    function getFeedsByIdInWei(bytes21[] calldata feedIds) external payable returns (uint256[] memory values, uint64 timestamp);
}

interface IFdcHub {
    function requestAttestation(bytes calldata data) external payable returns (bytes32);
}

interface IFdcVerification {
    function verifyPayment(bytes calldata data) external view returns (bool);
}

/**
 * @title FlarePublicGoods
 * @notice Autonomous developer funding using Flare's enshrined protocols
 * @dev Multi-chain deposits, FTSO price feeds, GitHub verification, and secure random distribution
 */
contract FlarePublicGoods is Ownable {
    using SafeERC20 for IERC20;

    // ============ State Variables ============

    /// @notice FXRP token
    IERC20 public immutable FXRP;

    /// @notice Flare Random Number provider
    IRandomNumberV2 public randomProvider;

    /// @notice FTSO v2 for price feeds
    IFtsoV2 public ftsoV2;

    /// @notice FDC Hub for attestations
    IFdcHub public fdcHub;

    /// @notice FDC Verification
    IFdcVerification public fdcVerification;

    // FTSO Feed IDs (from Flare docs)
    bytes21 public constant FLR_USD_FEED = bytes21(0x01464c522f55534400000000000000000000000000); // FLR/USD
    bytes21 public constant BTC_USD_FEED = bytes21(0x014254432f55534400000000000000000000000000); // BTC/USD
    bytes21 public constant XRP_USD_FEED = bytes21(0x015852502f55534400000000000000000000000000); // XRP/USD
    bytes21 public constant ETH_USD_FEED = bytes21(0x014554482f55534400000000000000000000000000); // ETH/USD
    bytes21 public constant DOGE_USD_FEED = bytes21(0x01444f47452f555344000000000000000000000000); // DOGE/USD

    /// @notice Developer projects registry
    struct Developer {
        address wallet;
        string githubRepo; // e.g. "owner/repo"
        uint256 totalFunded;
        uint256 githubStars; // Verified via JsonApi
        bool verified;
        uint256 lastFundedTimestamp;
    }

    /// @notice Deposit tracking
    struct Deposit {
        address depositor;
        uint256 amount;
        uint256 timestamp;
        string sourceChain; // "BTC", "DOGE", "XRP", "FXRP"
    }

    /// @notice Allocation weights based on price feeds
    struct AllocationConfig {
        uint256 minPriceThreshold; // Minimum FLR price for allocation (in USD wei)
        uint256 priceMultiplier; // Multiplier for price-weighted allocation (basis points)
        bool dynamicReallocation; // Enable automatic reallocation
    }

    // Storage
    mapping(address => Developer) public developers;
    address[] public developerList;
    mapping(address => uint256) public depositBalances;
    Deposit[] public deposits;
    AllocationConfig public allocationConfig;

    // Stats
    uint256 public totalDeposits;
    uint256 public totalFundedDevelopers;
    uint256 public nextAllocationTimestamp;
    uint256 public allocationInterval = 7 days; // Weekly allocations
    address public lastFundedDev;
    uint256 public lastAllocationAmount;

    // ============ Events ============

    event DeveloperRegistered(address indexed wallet, string githubRepo);
    event DeveloperVerified(address indexed wallet, uint256 githubStars);
    event DepositReceived(address indexed depositor, uint256 amount, string sourceChain);
    event DeveloperFunded(address indexed developer, uint256 amount, uint256 flrPrice);
    event AllocationConfigUpdated(uint256 minPrice, uint256 multiplier, bool dynamicReallocation);
    event CrossChainDepositVerified(string sourceChain, uint256 amount, bytes32 txHash);

    // ============ Constructor ============

    constructor(
        address _fxrp,
        address _randomProvider,
        address _ftsoV2,
        address _fdcHub,
        address _fdcVerification
    ) Ownable(msg.sender) {
        require(_fxrp != address(0), "Invalid FXRP");
        require(_randomProvider != address(0), "Invalid random provider");
        require(_ftsoV2 != address(0), "Invalid FTSO");

        FXRP = IERC20(_fxrp);
        randomProvider = IRandomNumberV2(_randomProvider);
        ftsoV2 = IFtsoV2(_ftsoV2);
        fdcHub = IFdcHub(_fdcHub);
        fdcVerification = IFdcVerification(_fdcVerification);

        // Default allocation config
        allocationConfig = AllocationConfig({
            minPriceThreshold: 0.01 ether, // $0.01 FLR minimum
            priceMultiplier: 10000, // 100% (basis points)
            dynamicReallocation: true
        });

        nextAllocationTimestamp = block.timestamp + allocationInterval;
    }

    // ============ Developer Registration ============

    /**
     * @notice Register as a developer to receive funding
     * @param _githubRepo GitHub repository (owner/repo format)
     */
    function registerDeveloper(string calldata _githubRepo) external {
        require(developers[msg.sender].wallet == address(0), "Already registered");
        require(bytes(_githubRepo).length > 0, "Invalid repo");

        developers[msg.sender] = Developer({
            wallet: msg.sender,
            githubRepo: _githubRepo,
            totalFunded: 0,
            githubStars: 0,
            verified: false,
            lastFundedTimestamp: 0
        });

        developerList.push(msg.sender);
        emit DeveloperRegistered(msg.sender, _githubRepo);
    }

    /**
     * @notice Verify developer's GitHub stars (owner only for now, will use JsonApi FDC)
     * @param _developer Developer address
     * @param _stars Number of GitHub stars
     */
    function verifyDeveloper(address _developer, uint256 _stars) external onlyOwner {
        require(developers[_developer].wallet != address(0), "Developer not registered");

        developers[_developer].githubStars = _stars;
        developers[_developer].verified = _stars >= 100; // Minimum 100 stars

        emit DeveloperVerified(_developer, _stars);
    }

    // ============ Deposit Functions ============

    /**
     * @notice Direct FXRP deposit
     * @param _amount Amount of FXRP to deposit
     */
    function deposit(uint256 _amount) external {
        require(_amount > 0, "Amount must be > 0");

        FXRP.safeTransferFrom(msg.sender, address(this), _amount);
        depositBalances[msg.sender] += _amount;
        totalDeposits += _amount;

        deposits.push(Deposit({
            depositor: msg.sender,
            amount: _amount,
            timestamp: block.timestamp,
            sourceChain: "FXRP"
        }));

        emit DepositReceived(msg.sender, _amount, "FXRP");
    }

    /**
     * @notice Verify cross-chain deposit via FDC Payment attestation
     * @param _proof FDC Payment proof
     * @param _sourceChain Source chain ("BTC", "DOGE", "XRP")
     * @dev In production, this would mint FXRP based on verified payment
     */
    function depositViaFDC(bytes calldata _proof, string calldata _sourceChain) external {
        // TODO: Implement FDC Payment verification
        // For now, this is a placeholder showing the concept

        // require(fdcVerification.verifyPayment(_proof), "Invalid proof");

        // Parse proof to get amount and sender
        // Mint FXRP for depositor
        // Track deposit

        emit CrossChainDepositVerified(_sourceChain, 0, bytes32(0));
    }

    // ============ FTSO Price Feed Functions ============

    /**
     * @notice Get all relevant price feeds
     * @return prices Array of prices [FLR, BTC, XRP, ETH, DOGE]
     * @return timestamp Latest update timestamp
     */
    function getAllPrices() public payable returns (uint256[] memory prices, uint64 timestamp) {
        bytes21[] memory feedIds = new bytes21[](5);
        feedIds[0] = FLR_USD_FEED;
        feedIds[1] = BTC_USD_FEED;
        feedIds[2] = XRP_USD_FEED;
        feedIds[3] = ETH_USD_FEED;
        feedIds[4] = DOGE_USD_FEED;

        return ftsoV2.getFeedsByIdInWei(feedIds);
    }

    /**
     * @notice Get FLR/USD price
     */
    function getFLRPrice() public payable returns (uint256 price, uint64 timestamp) {
        return ftsoV2.getFeedByIdInWei(FLR_USD_FEED);
    }

    /**
     * @notice Calculate allocation amount based on FLR price
     * @return allocation Calculated allocation amount
     */
    function calculatePriceWeightedAllocation() public payable returns (uint256 allocation) {
        (uint256 flrPrice,) = getFLRPrice();

        if (flrPrice < allocationConfig.minPriceThreshold) {
            return (totalDeposits * 5) / 100; // 5% baseline when price is low
        }

        // Price-weighted: higher FLR price = higher allocation
        uint256 priceBonus = (flrPrice * allocationConfig.priceMultiplier) / 1 ether;
        uint256 baseAllocation = (totalDeposits * 10) / 100; // 10% base

        allocation = baseAllocation + (baseAllocation * priceBonus) / 10000;

        // Cap at 20% of pool
        uint256 maxAllocation = (totalDeposits * 20) / 100;
        if (allocation > maxAllocation) {
            allocation = maxAllocation;
        }
    }

    // ============ Allocation Functions ============

    /**
     * @notice Allocate funds to verified developers
     * @dev Uses Secure Random to select developer
     */
    function allocateFunds() external {
        require(block.timestamp >= nextAllocationTimestamp, "Not time yet");
        require(developerList.length > 0, "No developers");
        require(totalDeposits > 0, "No funds");

        // Calculate allocation amount using price feeds
        uint256 allocationAmount = calculatePriceWeightedAllocation();
        require(allocationAmount > 0, "No allocation available");

        // Get secure random number
        (uint256 randomNumber, bool isSecure,) = randomProvider.getRandomNumber();
        require(isSecure, "Random not secure");

        // Filter verified developers
        address[] memory verifiedDevs = new address[](developerList.length);
        uint256 verifiedCount = 0;

        for (uint256 i = 0; i < developerList.length; i++) {
            if (developers[developerList[i]].verified) {
                verifiedDevs[verifiedCount] = developerList[i];
                verifiedCount++;
            }
        }

        require(verifiedCount > 0, "No verified developers");

        // Select developer using random number
        uint256 selectedIndex = randomNumber % verifiedCount;
        address selectedDev = verifiedDevs[selectedIndex];

        // Get current FLR price for event
        (uint256 flrPrice,) = getFLRPrice();

        // Transfer allocation
        FXRP.safeTransfer(selectedDev, allocationAmount);

        // Update state
        developers[selectedDev].totalFunded += allocationAmount;
        developers[selectedDev].lastFundedTimestamp = block.timestamp;
        totalFundedDevelopers++;
        totalDeposits -= allocationAmount;
        lastFundedDev = selectedDev;
        lastAllocationAmount = allocationAmount;
        nextAllocationTimestamp = block.timestamp + allocationInterval;

        emit DeveloperFunded(selectedDev, allocationAmount, flrPrice);
    }

    // ============ Admin Functions ============

    /**
     * @notice Update allocation configuration
     */
    function setAllocationConfig(
        uint256 _minPrice,
        uint256 _multiplier,
        bool _dynamicReallocation
    ) external onlyOwner {
        allocationConfig.minPriceThreshold = _minPrice;
        allocationConfig.priceMultiplier = _multiplier;
        allocationConfig.dynamicReallocation = _dynamicReallocation;

        emit AllocationConfigUpdated(_minPrice, _multiplier, _dynamicReallocation);
    }

    /**
     * @notice Set allocation interval
     */
    function setAllocationInterval(uint256 _interval) external onlyOwner {
        require(_interval >= 1 days, "Interval too short");
        allocationInterval = _interval;
    }

    // ============ View Functions ============

    function getDeveloperCount() external view returns (uint256) {
        return developerList.length;
    }

    function getVerifiedDeveloperCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < developerList.length; i++) {
            if (developers[developerList[i]].verified) {
                count++;
            }
        }
        return count;
    }

    function getDepositCount() external view returns (uint256) {
        return deposits.length;
    }

    function getDeveloper(address _dev) external view returns (Developer memory) {
        return developers[_dev];
    }
}
