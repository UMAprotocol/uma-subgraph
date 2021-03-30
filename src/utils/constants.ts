import { BigDecimal, BigInt, Address } from "@graphprotocol/graph-ts";
import { toDecimal } from "./decimals";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export let BIGINT_ZERO = BigInt.fromI32(0);
export let BIGINT_ONE = BigInt.fromI32(1);
export let BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export let BIGDECIMAL_ONE = toDecimal(BigInt.fromI32(10).pow(18));
export let BIGDECIMAL_HUNDRED = toDecimal(BigInt.fromI32(10).pow(20));

// Liquidation States
export const LIQUIDATION_PRE_DISPUTE = "PreDispute"
export const LIQUIDATION_PENDING_DISPUTE = "PendingDispute"
export const LIQUIDATION_DISPUTE_SUCCEEDED = "DisputeSucceeded"
export const LIQUIDATION_DISPUTE_FAILED = "DisputeFailed"

// List of EMP Factories that we want to index:
export let EMP_CREATORS = new Array<String>();
EMP_CREATORS.push("0xf763d367e1302a16716b6c40783a17c1ac754f2e")
EMP_CREATORS.push("0x8f6e999530787492c62cfa5a8c937a4be5886a13")

// List of Perp Factories that we want to index:
export let PERP_CREATORS = new Array<String>();
PERP_CREATORS.push("0x211aab73c56fef9314fb0889e4f045b5f27cdb3f")
