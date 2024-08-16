// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {IPermit2, IAllowanceTransfer, ISignatureTransfer } from "permit2/src/interfaces/IPermit2.sol";

// NOTE: All tokens sent to this contract are permanently lost because there is no withdraw function.
// NOTE: Educational purposes only.
contract Permit2App {

    IPermit2 public immutable permit2;

    error InvalidSpender();

    constructor(address _permit2) {
        permit2 = IPermit2(_permit2);
    }

    // Allowance Transfer when permit has not yet been called, or needs to be "refreshed".
    function allowanceTransferWithPermit(
        IAllowanceTransfer.PermitSingle calldata permitSingle, 
        bytes calldata signature, 
        uint160 amount
    ) public {
        _permitWithPermit2(permitSingle, signature);
        _receiveUserTokens(permitSingle.details.token, amount);
    }

    // Allowance Transfer when permit has already been called and isn't expired and within allowed amount.
    // Note: `permit2._transfer()` performs all the necessary security checks to ensure 
    // the allowance mapping for the spender is not expired and within allowed amount.
    function allowanceTransferWithoutPermit(address token, uint160 amount) public {
        _receiveUserTokens(token, amount);
    }

    // Helper function that calls `permit2.permit()`
    function _permitWithPermit2(IAllowanceTransfer.PermitSingle calldata permitSingle, bytes calldata signature) internal {
        if (permitSingle.spender != address(this)) revert InvalidSpender(); // This contract must have spending permissions for the user.
        permit2.permit(msg.sender, permitSingle, signature); // owner is explicitly msg.sender 
    }

    // Helper function that calls `permit2.transferFrom()`
    function _receiveUserTokens(address token, uint160 amount) internal {
        permit2.transferFrom(msg.sender, address(this), amount, token); // transfer allowed tokens from user to spender (our contract)
    }


    // Normal SignatureTransfer 
    function signatureTransfer(
        address token, 
        uint256 amount, 
        uint256 nonce, 
        uint256 deadline, 
        bytes calldata signature
    ) public {
        permit2.permitTransferFrom(
            // The permit message. Spender is inferred as the caller (this contract)
            ISignatureTransfer.PermitTransferFrom({
                permitted: ISignatureTransfer.TokenPermissions({
                    token: token,
                    amount: amount
                }),
                nonce: nonce,
                deadline: deadline
            }),
            // Transfer details
            ISignatureTransfer.SignatureTransferDetails({
                to: address(this),
                requestedAmount: amount
            }),
            msg.sender, // The owner of the tokens has to be the signer
            signature // The resulting signature from signing hash of permit data per EIP-712 standards
        );
    }


    // State needed for `signatureTransferWithWitness()`. Unconventionally placed here as to not clutter the other examples.
    struct Witness {
        address user; 
    }
    // The full type string should look like this (Notice structs are alphabetical):
    // "PermitWitnessTransferFrom(TokenPermissions permitted,address spender,uint256 nonce,uint256 deadline,Witness witness)TokenPermissions(address token,uint256 amount)Witness(address user)"
    // However, we only want to REMAINING EIP-712 structured type definition, starting exactly with the witness.
    string constant WITNESS_TYPE_STRING = "Witness witness)TokenPermissions(address token,uint256 amount)Witness(address user)";
    bytes32 constant WITNESS_TYPEHASH = keccak256("Witness(address user)"); // The type hash must hash our created witness struct.

    // SignatureTransfer technique with extra witness data
    function signatureTransferWithWitness(
        address token, 
        uint256 amount, 
        uint256 nonce, 
        uint256 deadline, 
        address user, // example extra witness data
        bytes calldata signature
    ) public {
        bytes32 witness = keccak256(abi.encode(WITNESS_TYPEHASH, Witness(user)));

        permit2.permitWitnessTransferFrom(
            ISignatureTransfer.PermitTransferFrom({
                permitted: ISignatureTransfer.TokenPermissions({
                    token: token,
                    amount: amount
                }),
                nonce: nonce,
                deadline: deadline
            }),
            ISignatureTransfer.SignatureTransferDetails({
                to: address(this),
                requestedAmount: amount
            }),
            msg.sender, // The owner of the tokens has to be the signer
            witness, // Witness - Extra data to include when checking the user signature
            WITNESS_TYPE_STRING, // EIP-712 type definition for REMAINING string stub of the typehash
            signature // The resulting signature from signing hash of permit data per EIP-712 standards
        );
    }
}