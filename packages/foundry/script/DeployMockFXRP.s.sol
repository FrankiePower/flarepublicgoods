// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {MockFXRP} from "../src/MockFXRP.sol";

contract DeployMockFXRP is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("Deploying MockFXRP...");
        MockFXRP mockFXRP = new MockFXRP();

        console.log("MockFXRP deployed at:", address(mockFXRP));
        console.log("Initial supply:", mockFXRP.totalSupply() / 10**18, "MFXRP");
        console.log("Faucet amount:", mockFXRP.FAUCET_AMOUNT() / 10**18, "MFXRP");
        console.log("Cooldown time:", mockFXRP.COOLDOWN_TIME() / 3600, "hours");

        vm.stopBroadcast();
    }
}
