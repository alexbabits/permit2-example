include .env

deploy_permit2App_to_sepolia:
	@forge build
	@forge script \
		--broadcast \
		--verify \
		--rpc-url $(SEPOLIA_RPC_URL) \
		--etherscan-api-key $(ETHSCAN_API_KEY) \
		--private-key $(PRIVATE_KEY) \
		script/DeployPermit2App.s.sol:DeployPermit2App


# ---------- LINK related script ----------

check_link_of_me_on_sepolia:
	@cast balance --erc20 $(SEPOLIA_LINK) $(ACCOUNT) --rpc-url $(SEPOLIA_RPC_URL)

check_link_of_permit2App_on_sepolia:
	@cast balance --erc20 $(SEPOLIA_LINK) $(SEPOLIA_PERMIT2APP) --rpc-url $(SEPOLIA_RPC_URL)

check_link_allowance_of_me_to_permit2_on_sepolia:
	@cast call $(SEPOLIA_LINK) "allowance(address,address)" $(ACCOUNT) $(PERMIT2) --rpc-url $(SEPOLIA_RPC_URL)

check_my_allowance_of_link_to_permit2App_on_sepolia:
	@cast call $(PERMIT2) "allowance(address,address,address)" $(ACCOUNT) $(SEPOLIA_LINK) $(SEPOLIA_PERMIT2APP) --rpc-url $(SEPOLIA_RPC_URL)


# ---------- USDC related script ----------

check_usdc_of_me_on_sepolia:
	@cast balance --erc20 $(SEPOLIA_USDC) $(ACCOUNT) --rpc-url $(SEPOLIA_RPC_URL)

check_usdc_of_permit2App_on_sepolia:
	@cast balance --erc20 $(SEPOLIA_USDC) $(SEPOLIA_PERMIT2APP) --rpc-url $(SEPOLIA_RPC_URL)

check_usdc_allowance_of_me_to_permit2_on_sepolia:
	@cast call $(SEPOLIA_USDC) "allowance(address,address)(uint256)" $(ACCOUNT) $(PERMIT2) --rpc-url $(SEPOLIA_RPC_URL)

check_my_allowance_of_usdc_to_permit2App_on_sepolia:
	@cast call $(PERMIT2) "allowance(address,address,address)(uint256)" $(ACCOUNT) $(SEPOLIA_USDC) $(SEPOLIA_PERMIT2APP) --rpc-url $(SEPOLIA_RPC_URL)