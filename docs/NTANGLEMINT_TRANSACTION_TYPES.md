# nTangleMint Transaction Type Derivation Logic

## Overview

Transaction types in nTangleMint are **derived from data**, not hardcoded. This approach is:
- **Scalable**: No need to update code when adding new transaction types
- **Elegant**: Transaction type emerges from the data structure
- **Backward-compatible**: Reserved fields allow future extensions

## Core Principle

All nTangleMint transactions use a fixed **15-field OP_RETURN structure** (null-byte separated):

```
Field 0:  "nTangleMint" (protocol identifier)
Field 1:  Transaction type indicator
Field 2:  programID (pid_{12-char-base36})
Field 3:  walletID (wid_{12-char-base36})
Field 4:  Type-specific data (varies)
Fields 5-14: Reserved for future use
```

## Transaction Types

### 1. PROGRAM (Program Registration/Deletion)

**When:** Program creator registers a new program on-chain

**Field 1:** "PROGRAM"

**Field 4 Content:** requiredPunches (numeric string, e.g., "6")

**Full Structure:**
```
Field 0: "nTangleMint"
Field 1: "PROGRAM"
Field 2: programID (pid_abc123def456)
Field 3: walletID (wid_creator12345) - program creator
Field 4: requiredPunches (e.g., "6")
Field 5: expirationDays (e.g., "365")
Field 6: reward (URL-encoded, short description)
Field 7: satoshisPerPunch (e.g., "1000")
Fields 8-14: Reserved
```

**Derivation:** If `Field 1 == "PROGRAM"` → This is a program registration transaction

---

### 2. DELETE (Program Deletion)

**When:** Program creator deletes an active program

**Field 1:** "DELETE"

**Field 4 Content:** Empty (reserved for future reason codes)

**Full Structure:**
```
Field 0: "nTangleMint"
Field 1: "DELETE"
Field 2: programID (pid_abc123def456)
Field 3: walletID (wid_creator12345) - program creator
Fields 4-14: Reserved
```

**Derivation:** If `Field 1 == "DELETE"` → This is a program deletion transaction

---

### 3. nTangle (Card Creation / First Purchase)

**When:** Customer joins a program with their first purchase

**Field 1:** "nTangle"

**Field 4 Content:** "1" (always, because this is the first punch)

**Full Structure:**
```
Field 0: "nTangleMint"
Field 1: "nTangle"
Field 2: programID (pid_abc123def456)
Field 3: walletID (wid_customer1234) - customer
Field 4: "1" (punchIndex - always 1 for card creation)
Fields 5-14: Reserved
```

**Derivation:** If `Field 1 == "nTangle" AND Field 4 == "1"` → This is card creation

**On-chain Proof:** The txId of this transaction IS the PunchID (immutable proof of card creation)

---

### 4. nProcess (Subsequent Punch / Accumulation)

**When:** Customer earns additional punches after card creation

**Field 1:** "nProcess"

**Field 4 Content:** Empty (punchIndex is derived from blockchain query, not stored)

**Full Structure:**
```
Field 0: "nTangleMint"
Field 1: "nProcess"
Field 2: programID (pid_abc123def456)
Field 3: walletID (wid_customer1234) - customer
Fields 4-14: Reserved (not populated for this type)
```

**Derivation:** If `Field 1 == "nProcess"` → This is a punch accumulation transaction

**How punchIndex is Derived:**
1. Query blockchain for all transactions with `programID == target AND walletID == target`
2. Filter for transactions where `Field 1 IN ["nTangle", "nProcess", "Redeemed"]`
3. Count these transactions: `punchIndex = count + 1`

**Example:**
- If blockchain has 1 nTangle + 2 nProcess transactions for a wallet in a program
- Next nProcess transaction has `punchIndex = 3 + 1 = 4`

This design **saves space** in OP_RETURN and **eliminates edge cases** from out-of-order transactions.

---

### 5. Redeemed (Reward Claimed / Card Completion)

**When:** Customer has earned enough punches to complete the program

**Field 1:** "Redeemed"

**Field 4 Content:** Empty (punchIndex is derived from blockchain query)

**Full Structure:**
```
Field 0: "nTangleMint"
Field 1: "Redeemed"
Field 2: programID (pid_abc123def456)
Field 3: walletID (wid_customer1234) - customer
Fields 4-14: Reserved
```

**Derivation:** If `Field 1 == "Redeemed"` → This is a reward redemption transaction

**On-chain Proof:** The txId of this transaction is stored as `completionTxId` (immutable proof of card completion)

---

## Derivation Algorithm

```typescript
function deriveTransactionType(field1: string, field4?: string) {
  if (field1 === "PROGRAM") return { type: "PROGRAM_REGISTRATION", ... }
  if (field1 === "DELETE") return { type: "PROGRAM_DELETION", ... }
  
  if (field1 === "nTangle" && field4 === "1") {
    return { type: "PUNCH_CREATION", punchIndex: 1, ... }
  }
  
  if (field1 === "nProcess") {
    const punchIndex = deriveFromBlockchain(programID, walletID) + 1
    return { type: "PUNCH_ACCUMULATION", punchIndex, ... }
  }
  
  if (field1 === "Redeemed") {
    const punchIndex = deriveFromBlockchain(programID, walletID)
    return { type: "PUNCH_REDEMPTION", punchIndex, ... }
  }
}
```

## Key Benefits

### 1. **Data-Driven Design**
- No hardcoded transaction types in application logic
- Types emerge from OP_RETURN structure
- Easy to add new types without breaking existing code

### 2. **Space Efficiency**
- punchIndex derived from blockchain state, not stored in every OP_RETURN
- Reduces on-chain data footprint
- Saves BSV transaction fees

### 3. **Scalability**
- Reserved fields allow future enhancements
- New transaction types can be added by introducing new Field 1 values
- Backward-compatible: old parsers can ignore new types

### 4. **Immutable Proof**
- Each transaction's txId is the immutable proof
- No need for separate PunchID or CompletionID fields
- Blockchain hash is the proof

---

## Implementation Examples

### Example 1: Query All Punches for a Wallet/Program

```typescript
const punches = await queryBlockchain({
  field2: programID,
  field3: walletID,
  field1: ["nTangle", "nProcess", "Redeemed"]
});

const punchCount = punches.length; // This is the customer's current punch count
const isComplete = punchCount >= program.metadata.requiredPunches;
```

### Example 2: Derive Transaction Type from OP_RETURN

```typescript
const opReturn = parseTransaction(txId);
const field1 = opReturn[1];
const field4 = opReturn[4];

const type = deriveTransactionType(field1, field4);

if (type.indicator === "nTangle") {
  console.log(`New punch card created at ${txId}`);
}
```

### Example 3: Validate Before Broadcasting

```typescript
// Before broadcasting nProcess, verify card hasn't reached completion
const currentPunches = await blockchain.countPunches(programID, walletID);
const willComplete = (currentPunches + 1) >= program.metadata.requiredPunches;

if (willComplete) {
  // Next transaction should be Redeemed, not nProcess
  throw new Error("Card is complete. Use Redeemed transaction instead.");
}
```

---

## Reserved Fields for Future Use

Fields 5-14 are reserved. Possible future uses:

- **Field 5:** Metadata version (allows format evolution)
- **Field 6:** Custom merchant data (hex-encoded)
- **Field 7:** Loyalty points earned/redeemed
- **Field 8:** Tier bonus multiplier
- **Field 9:** Promotional code applied
- **Field 10-14:** Open for future extensions

Adding new fields to an existing transaction type requires incrementing `NTANGLEMINT_FORMAT_VERSION` and adding a new transaction type indicator.

---

## Schema Definition

See `/lib/constants/ntanglemint-schema.ts` for:
- Canonical field structure for all transaction types
- Validation utilities
- Derivation function implementations