import {
  NewContractRegistered,
  AddedSharedMember,
  RemovedSharedMember
} from "../../generated/Registry/Registry";
import { CreatedExpiringMultiParty } from "../../generated/templates/ExpiringMultiPartyCreator/ExpiringMultiPartyCreator";
import { ExpiringMultiParty } from "../../generated/templates/ExpiringMultiParty/ExpiringMultiParty";
import { CreatedPerpetual } from "../../generated/templates/PerpetualCreator/PerpetualCreator";
import { Perpetual } from "../../generated/templates/Perpetual/Perpetual";

import {
  getOrCreatePerpetualContract,
  getOrCreateFinancialContract,
  getOrCreatePerpetualCreator,
  getOrCreateContractCreator,
  getOrCreateToken,
  calculateGCR
} from "../utils/helpers";
import { BIGINT_ONE, EMP_CREATORS, PERP_CREATORS } from "../utils/constants";
import { toDecimal } from "../utils/decimals";

// - event: NewContractRegistered(indexed address,indexed address,address[])
//   handler: handleNewContractRegistered
export function handleNewContractRegistered(
  event: NewContractRegistered
): void {
  // Check if EMP:
  if (
    EMP_CREATORS.includes(event.params.creator.toHexString())
  ) {
    // TODO: Rename to `getOrCreateEmp`
    let contract = getOrCreateFinancialContract(
      event.params.contractAddress.toHexString()
    );
    let creator = getOrCreateContractCreator(
      event.params.creator.toHexString()
    );

    contract.address = event.params.contractAddress;
    contract.creator = creator.id;

    contract.save();
    creator.save();
  } 
  // Check if Perp:
  else if (
    PERP_CREATORS.includes(event.params.creator.toHexString())
  ) {
    let contract = getOrCreatePerpetualContract(
      event.params.contractAddress.toHexString()
    );
    let creator = getOrCreatePerpetualCreator(
      event.params.creator.toHexString()
    );

    contract.address = event.params.contractAddress;
    contract.creator = creator.id;

    contract.save();
    creator.save();
  }
}

// - event: AddedSharedMember(indexed uint256,indexed address,indexed address)
//   handler: handleAddedSharedMember

export function handleAddedSharedMember(event: AddedSharedMember): void {
  if (event.params.roleId == BIGINT_ONE) {
    let creator = getOrCreateContractCreator(
      event.params.newMember.toHexString()
    );

    creator.manager = event.params.manager;
    creator.isRemoved = false;

    creator.save();
  }
}

// - event: RemovedSharedMember(indexed uint256,indexed address,indexed address)
//   handler: handleRemovedSharedMember

export function handleRemovedSharedMember(event: RemovedSharedMember): void {
  if (event.params.roleId == BIGINT_ONE) {
    let creator = getOrCreateContractCreator(
      event.params.oldMember.toHexString()
    );

    creator.manager = event.params.manager;
    creator.isRemoved = true;

    creator.save();
  }
}

// - event: CreatedExpiringMultiParty(indexed address,indexed address)
//   handler: handleCreatedExpiringMultiParty

export function handleCreatedExpiringMultiParty(
  event: CreatedExpiringMultiParty
): void {
    let contract = getOrCreateFinancialContract(
      event.params.expiringMultiPartyAddress.toHexString()
    );
    let empContract = ExpiringMultiParty.bind(
      event.params.expiringMultiPartyAddress
    );

    let collateral = empContract.try_collateralCurrency();
    let synthetic = empContract.try_tokenCurrency();
    let requirement = empContract.try_collateralRequirement();
    let expiration = empContract.try_expirationTimestamp();
    let totalOutstanding = empContract.try_totalTokensOutstanding();
    let feeMultiplier = empContract.try_cumulativeFeeMultiplier();
    let rawCollateral = empContract.try_rawTotalPositionCollateral();

    if (!collateral.reverted) {
      let collateralToken = getOrCreateToken(
        collateral.value,
        true,
        true
      );
      contract.collateralToken = collateralToken.id;
    }

    if (!synthetic.reverted) {
      let syntheticToken = getOrCreateToken(synthetic.value, true, false);
      contract.syntheticToken = syntheticToken.id;
    }

    contract.deployer = event.params.deployerAddress;
    contract.address = event.params.expiringMultiPartyAddress;
    contract.collateralRequirement = requirement.reverted
      ? null
      : toDecimal(requirement.value);
    contract.expirationTimestamp = expiration.reverted
      ? null
      : expiration.value;
    contract.totalTokensOutstanding = totalOutstanding.reverted
      ? null
      : toDecimal(totalOutstanding.value);
    contract.cumulativeFeeMultiplier = feeMultiplier.reverted
      ? null
      : toDecimal(feeMultiplier.value);
    contract.rawTotalPositionCollateral = rawCollateral.reverted
      ? null
      : toDecimal(rawCollateral.value);

    contract.globalCollateralizationRatio = calculateGCR(
      contract.rawTotalPositionCollateral,
      contract.cumulativeFeeMultiplier,
      contract.totalTokensOutstanding
    );

    contract.save();
}

// - event: CreatedPerpetual(indexed address,indexed address)
//   handler: handleCreatedPerpetual

export function handleCreatedPerpetual(
  event: CreatedPerpetual
): void {
    let contract = getOrCreateFinancialContract(
      event.params.perpetualAddress.toHexString()
    );
    let perpetualContract = Perpetual.bind(
      event.params.perpetualAddress
    );

    let collateral = perpetualContract.try_collateralCurrency();
    let synthetic = perpetualContract.try_tokenCurrency();
    let requirement = perpetualContract.try_collateralRequirement();
    let totalOutstanding = perpetualContract.try_totalTokensOutstanding();
    let feeMultiplier = perpetualContract.try_cumulativeFeeMultiplier();
    let rawCollateral = perpetualContract.try_rawTotalPositionCollateral();

    if (!collateral.reverted) {
      let collateralToken = getOrCreateToken(
        collateral.value,
        true,
        true
      );
      contract.collateralToken = collateralToken.id;
    }

    if (!synthetic.reverted) {
      let syntheticToken = getOrCreateToken(synthetic.value, true, false);
      contract.syntheticToken = syntheticToken.id;
    }

    contract.deployer = event.params.deployerAddress;
    contract.address = event.params.perpetualAddress;
    contract.collateralRequirement = requirement.reverted
      ? null
      : toDecimal(requirement.value);
    contract.totalTokensOutstanding = totalOutstanding.reverted
      ? null
      : toDecimal(totalOutstanding.value);
    contract.cumulativeFeeMultiplier = feeMultiplier.reverted
      ? null
      : toDecimal(feeMultiplier.value);
    contract.rawTotalPositionCollateral = rawCollateral.reverted
      ? null
      : toDecimal(rawCollateral.value);

    contract.globalCollateralizationRatio = calculateGCR(
      contract.rawTotalPositionCollateral,
      contract.cumulativeFeeMultiplier,
      contract.totalTokensOutstanding
    );

    contract.save();
}

