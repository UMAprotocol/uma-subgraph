import {
  FinancialContract,
  ContractCreator,
  Token
} from "../../../generated/schema";
import {
  CollateralERC20,
  ExpiringMultiParty,
  ExpiringMultiPartyCreator,
  Perpetual,
  PerpetualCreator
} from "../../../generated/templates";
import { ERC20 } from "../../../generated/templates/ExpiringMultiPartyCreator/ERC20";
import { Address } from "@graphprotocol/graph-ts";
import { DEFAULT_DECIMALS, toDecimal } from "../decimals";
import { BIGDECIMAL_ZERO, BIGDECIMAL_ONE } from "../constants";

export function getOrCreateFinancialContract(
  id: String,
  createIfNotFound: boolean = true
): FinancialContract {
  let contract = FinancialContract.load(id);

  if (contract == null && createIfNotFound) {
    contract = new FinancialContract(id);
    contract.totalSyntheticTokensCreated = BIGDECIMAL_ZERO;
    contract.totalSyntheticTokensBurned = BIGDECIMAL_ZERO;
    contract.totalCollateralDeposited = BIGDECIMAL_ZERO;
    contract.totalCollateralWithdrawn = BIGDECIMAL_ZERO;
    contract.cumulativeFeeMultiplier = BIGDECIMAL_ONE; // Hardcoded in the contract
    contract.cumulativeFundingRateMultiplier = BIGDECIMAL_ONE; 
    // EMP's don't have a CFRM so its TBD whether its better to default to 1, 0 or something nonsensical like -1.

    ExpiringMultiParty.create(Address.fromString(id));
  }

  return contract as FinancialContract;
}

export function getOrCreatePerpetualContract(
  id: String,
  createIfNotFound: boolean = true
): FinancialContract {
  let contract = FinancialContract.load(id);

  if (contract == null && createIfNotFound) {
    contract = new FinancialContract(id);
    contract.totalSyntheticTokensCreated = BIGDECIMAL_ZERO;
    contract.totalSyntheticTokensBurned = BIGDECIMAL_ZERO;
    contract.totalCollateralDeposited = BIGDECIMAL_ZERO;
    contract.totalCollateralWithdrawn = BIGDECIMAL_ZERO;
    contract.cumulativeFeeMultiplier = BIGDECIMAL_ONE; // Hardcoded in the contract
    contract.cumulativeFundingRateMultiplier = BIGDECIMAL_ONE; // Can't always assume it's 1 but its a reasonable fix
    // for now.

    Perpetual.create(Address.fromString(id));
  }

  return contract as FinancialContract;
}

export function getOrCreateContractCreator(
  id: String,
  createIfNotFound: boolean = true
): ContractCreator {
  let contractCreator = ContractCreator.load(id);

  if (contractCreator == null && createIfNotFound) {
    contractCreator = new ContractCreator(id);
    contractCreator.isRemoved = false;

    ExpiringMultiPartyCreator.create(Address.fromString(id));
  }

  return contractCreator as ContractCreator;
}

export function getOrCreatePerpetualCreator(
  id: String,
  createIfNotFound: boolean = true
): ContractCreator {
  let contractCreator = ContractCreator.load(id);

  if (contractCreator == null && createIfNotFound) {
    contractCreator = new ContractCreator(id);
    contractCreator.isRemoved = false;

    PerpetualCreator.create(Address.fromString(id));
  }

  return contractCreator as ContractCreator;
}


export function getOrCreateToken(
  tokenAddress: Address,
  persist: boolean = true,
  indexAsCollateral: boolean = false
): Token {
  let addressString = tokenAddress.toHexString();

  let token = Token.load(addressString);

  if (token == null) {
    token = new Token(addressString);
    token.address = tokenAddress;

    let erc20Token = ERC20.bind(tokenAddress);

    let tokenDecimals = erc20Token.try_decimals();
    let tokenName = erc20Token.try_name();
    let tokenSymbol = erc20Token.try_symbol();

    token.decimals = !tokenDecimals.reverted
      ? tokenDecimals.value
      : DEFAULT_DECIMALS;
    token.name = !tokenName.reverted ? tokenName.value : "";
    token.symbol = !tokenSymbol.reverted ? tokenSymbol.value : "";
    token.indexingAsCollateral = false;
    token.isOnWhitelist = false;

    if (indexAsCollateral) {
      CollateralERC20.create(tokenAddress);
      token.indexingAsCollateral = true;
    }

    if (persist) {
      token.save();
    }
  }

  if (indexAsCollateral && !token.indexingAsCollateral) {
    CollateralERC20.create(tokenAddress);
    token.indexingAsCollateral = true;
    token.save();
  }

  return token as Token;
}
