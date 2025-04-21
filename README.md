See the full Permit2 Implementation article here at [Cyfrin](https://www.cyfrin.io/blog/how-to-implement-permit2).

# How to learn from this example

1. Ensure you have enough ETH, LINK and USDC in your Sepolia account.
   - [Sepolia Faucet](https://sepoliafaucet.com/)
   - [LINK Faucet](https://faucets.chain.link/sepolia)
   - [USDC faucet](https://faucet.circle.com/)

2. Copy `.env.example` to `.env` and fill in the required values.

    ```sh
    cp .env.example .env
    ```
    - `SEPOLIA_RPC_URL` / `SEPOLIA_KEY`: You can get your Sepolia key from [Infura](https://infura.io/).
    - `ACCOUNT`: The address of the account for deploying and interacting with the contracts.
    - `PRIVATE_KEY`: The private key of the account for deploying and interacting with the contracts.
    - `ETHSCAN_API_KEY`: The API key for Etherscan to verify the contracts after deployment.
    - `SEPOLIA_PERMIT2APP`: The address of the deployed Permit2App contract on Sepolia. **Filled in after deployment.**
    

3. Install the required dependencies:

    ```sh
    npm install
    ```

    ```sh
    rm -rf lib
    forge install foundry-rs/forge-std Uniswap/permit2 --no-commit
    ```

4. Deploy the `Permit2App.sol` contract:

    ```sh
    make deploy_permit2App_to_sepolia
    ```

    Remember to update the `SEPOLIA_PERMIT2APP` in `.env` to the address of the deployed contract.

5. Now you can interact with the Permit2App contract through the scripts in [`/src`](./src).
   
   - Basic example: `src/Permit2App.link.js`
   - Advanced example: `src/Permit2App.usdc.js`

    Besides, the commands in [`Makefile`](./Makefile) help you to check the balance and allowance, so that you can better understand what exactly happens after each transaction.