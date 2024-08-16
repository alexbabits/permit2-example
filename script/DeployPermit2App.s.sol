// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {Permit2App} from "../src/Permit2App.sol";

// Deploy: `forge script script/DeployPermit2App.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast`
// Note: May need to run `forge clean` and `forge build` to clear old builds
contract DeployPermit2App is Script {

    function run() public {

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        address permit2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3; // Uniswap's Permit2 address on Sepolia
        Permit2App permit2App = new Permit2App(permit2);
        console.log("Deployed Permit2App.sol at address: ", address(permit2App));

        vm.stopBroadcast();
    }
}