const { ethers } = require("ethers");
const { 
    AllowanceTransfer, // Useful for generating permit data for allowance style approvals
    SignatureTransfer, // Useful for generating permit data for signature style approvals
    PERMIT2_ADDRESS, // 0x000000000022D473030F116dDEE9F6B43aC78BA3
    MaxAllowanceTransferAmount } = require('@uniswap/permit2-sdk');
require('dotenv/config');

// Numbered "steps" for things are not necessarily for following strictly,
// but just sectioning off chunks of the code in a nice manner.


// 1. Instantiate Provider & Signer
const provider = new ethers.providers.InfuraProvider("sepolia", process.env.SEPOLIA_KEY);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);


// 2. Instantiate our Permit2App Contract
const permit2AppABI = require("../out/Permit2App.sol/Permit2App.json").abi;
const permit2AppAddress = "0xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"; // Your deployed Permit2App address here.
const permit2AppContract = new ethers.Contract(permit2AppAddress, permit2AppABI, signer); 


// 3. Instantiate example token to use. (You must have some of these tokens on the chain you choose).
const tokenAddress = "0x779877A7B0D9E8603169DdbD7836e478b4624789"; // LINK on Sepolia (Your token address here).
const tokenApprovalABI = ['function approve(address spender, uint256 amount) returns (bool)']; // only need `approve()`
const tokenContract = new ethers.Contract(tokenAddress, tokenApprovalABI, signer);


// 4. 
// Instantiate Uniswap's Permit2 contract for direct interactions without SDK.
// (The SDK's `AllowanceProvider` failed to retreive the `nonce` value needed from `allowance` mapping state).
// Complete ABI if other interactions are desired: https://github.com/Uniswap/sdks/blob/main/sdks/permit2-sdk/abis/Permit2.json
const permit2ABI = [{"inputs": [{"internalType": "address", "name": "user", "type": "address"},{"internalType": "address", "name": "token", "type": "address"}, {"internalType": "address", "name": "spender", "type": "address"}], "name": "allowance", "outputs": [{"internalType": "uint160", "name": "amount", "type": "uint160"}, {"internalType": "uint48", "name": "expiration", "type": "uint48"}, {"internalType": "uint48", "name": "nonce", "type": "uint48"}], "stateMutability": "view", "type": "function"}];
const permit2Contract = new ethers.Contract(PERMIT2_ADDRESS, permit2ABI, provider);


// 5. One time "initialization" step to approve Permit2 contract for user's token.
async function approveTokenPermit2() {
    try {
        const tx = await tokenContract.approve(PERMIT2_ADDRESS, ethers.constants.MaxUint256);
        console.log("Approval Tx sent:", tx.hash);
        await tx.wait();
        console.log("Approval Tx Confirmed");
    } catch (error) {
        console.error("approveTokenPermit2 error:", error);
        throw error;
    }
}
//approveTokenPermit2(); // Run once if approval of a token is needed for first run through.


// 6. Creates and signs permit data. Execute our Permit2App `allowanceTransferWithPermit()`.
async function allowanceTransferWithPermit() {
    try {

        // Obtain the current nonce in Permit2 state for the [owner, token, spender]
        // SDK appeared to not work, so getting it directly from Permit2 contract instead.
        const owner = await signer.getAddress();
        const [ , , nonce] = await permit2Contract.allowance(owner, tokenAddress, permit2AppAddress);
        const currentNonce = parseInt(nonce, 10); // parse nonce's returned string value into base 10 integer.

        // Create a permit object
        const permitSingle = {
            details: {
                token: tokenAddress,
                amount: MaxAllowanceTransferAmount, // type(uint160).max
                expiration: calculateEndTime(30 * 24 * 60 * 60 * 1000), // 30 days
                nonce: currentNonce,
            },
            spender: permit2AppAddress,
            sigDeadline: calculateEndTime(30 * 60 * 1000), // 30 minutes
        };
        console.log("permit object:", permitSingle);

        // Get the chainId (Sepolia = 11155111)
        const network = await provider.getNetwork();
        const chainId = network.chainId;
        console.log("ChainID:", chainId);

        // Generate the permit return data & sign it
        const { domain, types, values } = AllowanceTransfer.getPermitData(permitSingle, PERMIT2_ADDRESS, chainId);
        const signature = await signer._signTypedData(domain, types, values);
        console.log("Signature:", signature);

        // Format an amount user wants to transfer (hardcoded for example)
        const amount = ethers.utils.parseUnits("0.1", 18); // 0.1 LINK on Sepolia
        console.log("Amount:", amount);

        // Call our function that uses permit2 to `transferFrom()` to our contract.
        const tx = await permit2AppContract.allowanceTransferWithPermit(permitSingle, signature, amount);
        console.log("Transfer with permit tx sent:", tx.hash);
        await tx.wait();
        console.log("Tx confirmed");

    } catch (error) {
        console.error("allowanceTransferWithPermit error:", error);
        throw error;
    }
}
//allowanceTransferWithPermit();


// 7. 
// If a user has already called `permit2.permit()` for their token 
// and the permission is still valid (X days, X amount),
// we can freely continue to transfer until expiration or amount exceeded. 
async function allowanceTransferWithoutPermit() {
    try {
        // Amount user wants to send to `permit2App.sol`.
        const amount = ethers.utils.parseUnits("0.1", 18); // 0.1 LINK on Sepolia
        console.log("Amount:", amount);

        // Call our function that uses permit2 to `transferFrom()` to our contract.
        const tx = await permit2AppContract.allowanceTransferWithoutPermit(tokenAddress, amount);
        console.log("Allowance Transfer without permit tx sent:", tx.hash);
        await tx.wait();
        console.log("Tx confirmed");
    } catch (error) {
        console.error("allowanceTransferWithoutPermit error:", error);
        throw error;   
    }
}
//allowanceTransferWithoutPermit();


// 8. Intended for one-time signature of approval to transfer tokens.
async function signatureTransfer() {
    try {
        // declare needed vars
        const nonce = Math.floor(Math.random() * 1e15); // 1 quadrillion potential nonces
        const deadline = calculateEndTime(30 * 60 * 1000); // 30 minute sig deadline
        // permit amount MUST match passed in signature transfer amount,
        // unlike with AllowanceTransfer where permit amount can be uint160.max
        // while the actual transfer amount can be less.
        const amount = ethers.utils.parseUnits("0.1", 18); 

        // create permit object
        const permit = {
            permitted: {
                token: tokenAddress,
                amount: amount
            },
            spender: permit2AppAddress,
            nonce: nonce, 
            deadline: deadline 
        };
        console.log("permit object:", permit);

        // Get the chainId (Sepolia = 11155111)
        const network = await provider.getNetwork();
        const chainId = network.chainId;
        console.log("ChainID:", chainId);

        // Generate the permit return data & sign it
        const { domain, types, values } = SignatureTransfer.getPermitData(permit, PERMIT2_ADDRESS, chainId);
        const signature = await signer._signTypedData(domain, types, values);
        console.log("Signature:", signature);

        // Call our `signatureTransfer()` function with correct data and signature
        const tx = await permit2AppContract.signatureTransfer(tokenAddress, amount, nonce, deadline, signature);
        console.log("Transfer with permit tx sent:", tx.hash);
        await tx.wait();
        console.log("Tx confirmed");

    } catch (error) {
        console.error("signatureTransfer error:", error);
        throw error;   
    }
}
//signatureTransfer();


// 9. Signature transfer, but this time with extra witness data
async function signatureTransferWithWitness() {
    try {
        // declare needed vars
        const nonce = Math.floor(Math.random() * 1e15); // 1 quadrillion potential nonces
        const deadline = calculateEndTime(30 * 60 * 1000); // 30 minute sig deadline
        const amount = ethers.utils.parseUnits("0.1", 18); // amount must match (see `signatureTransfer()`)
        const user = "0x0000000000000000000000000000000000001337"; // Can be whatever we want.

        // create a permit object
        const permit = {
            permitted: {
                token: tokenAddress,
                amount: amount
            },
            spender: permit2AppAddress,
            nonce: nonce, 
            deadline: deadline 
        };
        console.log("permit object:", permit);

        // create witness
        const witness = {
            witnessTypeName: 'Witness', // type name must match the struct name we created in Permit2App
            witnessType: { Witness: [{ name: 'user', type: 'address' }] }, // must match structs data
            witness: { user: user }, // witness' value
        }
        console.log("witness object:", witness);

        // Get the chainId (Sepolia = 11155111)
        const network = await provider.getNetwork();
        const chainId = network.chainId;
        console.log("ChainID:", chainId);

        // Generate the permit return data & sign it
        const { domain, types, values } = SignatureTransfer.getPermitData(permit, PERMIT2_ADDRESS, chainId, witness);
        const signature = await signer._signTypedData(domain, types, values);
        console.log("Signature:", signature);

        // Call our `signatureTransferWithWitness()` function with correct data and signature (which includes extra witness data)
        const tx = await permit2AppContract.signatureTransferWithWitness(tokenAddress, amount, nonce, deadline, user, signature);
        console.log("Transfer with witness tx sent:", tx.hash);
        await tx.wait();
        console.log("Tx confirmed");

    } catch (error) {
        console.error("signatureTransferWithWitness error:", error);
        throw error;   
    }
}
//signatureTransferWithWitness();


// Adds a duration (ms) to current unix time (ms). Outputs ending time in seconds, not ms.
function calculateEndTime(duration) {
    return Math.floor((Date.now() + duration) / 1000);
}