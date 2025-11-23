// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {FlarePublicGoods} from "../src/FlarePublicGoods.sol";

contract DeployFlarePublicGoods is Script {
    address constant FXRP_ADDRESS = 0x8b4abA9C4BD7DD961659b02129beE20c6286e17F;
    address constant RANDOM_V2_ADDRESS = 0x5CdF9eAF3EB8b44fB696984a1420B56A7575D250;
    address constant FTSO_V2_ADDRESS = 0x3d893C53D9e8056135C26C8c638B76C8b60Df726;
    address constant FDC_HUB_ADDRESS = 0x0C842DFE4292A285f76F4Ac83b4156A15093A841;
    address constant FDC_VERIFICATION_ADDRESS = 0x0C842DFE4292A285f76F4Ac83b4156A15093A841;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("Deploying FlarePublicGoods...");
        FlarePublicGoods fpg = new FlarePublicGoods(
            FXRP_ADDRESS,
            RANDOM_V2_ADDRESS,
            FTSO_V2_ADDRESS,
            FDC_HUB_ADDRESS,
            FDC_VERIFICATION_ADDRESS
        );

        console.log("Contract:", address(fpg));
        vm.stopBroadcast();
    }
}
