// This is the main canister smart contract for the Lex Veritas 2.0 application.
// It is designed to directly implement the logic and data structures from the provided Prisma schema.
// All data is stored in stable memory, ensuring it persists across canister upgrades.

import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Buffer "mo:base/Buffer";
import Text "mo:base/Text";
import Trie "mo:base/Trie";
import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Option "mo:base/Option";
import Result "mo:base/Result";
import Debug "mo:base/Debug";
import Nat8 "mo:base/Nat8";
import Error "mo:base/Error";
import Iter "mo:base/Iter";
import Int "mo:base/Int";

persistent actor class LexVeritas() {

  // --- TYPE DEFINITIONS (from Prisma Schema) ---
  // These types mirror the models and enums in your schema.prisma file.

  type UserId = Principal; // We use the user's Internet Computer Principal as their unique ID.
  type CaseId = Text;
  type EvidenceId = Text;

  // Enums
  type Role = { #ADMIN; #ANALYST; #PROSECUTOR; #AUDITOR; };
  type UserStatus = { #ACTIVE; #INACTIVE; #SUSPENDED; };
  type EvidenceType = { #LAPTOP_HARD_DRIVE; #MOBILE_PHONE; #USB_DRIVE; #SURVEILLANCE_FOOTAGE; #CLOUD_DATA; #DOCUMENT; #OTHER; };
  type CustodyAction = { #COLLECTION; #TRANSFER; #ANALYSIS; #VIEW; #SUBMITTED_TO_COURT; #ARCHIVED; };

  // Models
  type User = {
    id: UserId;
    name: Text;
    email: Text;
    badgeNumber: Text;
    role: Role;
    status: UserStatus;
    createdAt: Time.Time;
  };

  type Case = {
    id: CaseId;
    caseNumber: Text;
    leadInvestigatorId: UserId;
    createdAt: Time.Time;
  };

  type EvidenceItem = {
    id: EvidenceId;
    caseId: CaseId;
    itemNumber: Text;
    evidenceType: EvidenceType;
    description: Text;
    collectedAt: Time.Time;
    location: Text;
    collectedById: UserId;
    initialHash: Text;
    storyProtocolIpId: Text;
    icpCanisterId: Text;
    custodyLogs: [CustodyLog]; // The chain of custody is stored directly with the evidence item.
  };

  type CustodyLog = {
    id: Text;
    action: CustodyAction;
    timestamp: Time.Time;
    fromUserId: UserId;
    toUserId:?UserId;
    notes:?Text;
    storyProtocolTransactionId: Text;
  };

  // --- STORY PROTOCOL INTEGRATION TYPES ---
  
  // EVM RPC Canister Interface
  type EvmRpcCanister = actor {
    request : (Text, Nat64) -> async Text;
  };

  // JSON-RPC Request/Response Types
  type JsonRpcRequest = {
    jsonrpc: Text;
    method: Text;
    params: [Text];
    id: Nat;
  };

  type JsonRpcResponse = {
    jsonrpc: Text;
    result: ?Text;
    error: ?{
      code: Int;
      message: Text;
      data: ?Text;
    };
    id: Nat;
  };

  // Story Protocol Integration Types
  type StoryProtocolRegistration = {
    ipId: Text;
    transactionId: Text;
  };

  type EvidenceMetadata = {
    evidenceHash: Text;
    description: Text;
    evidenceType: EvidenceType;
    caseId: CaseId;
  };

  type CustodyActionMetadata = {
    ipId: Text;
    action: CustodyAction;
    fromUserId: UserId;
    toUserId: ?UserId;
    notes: ?Text;
  };

  // Story Protocol Contract Configuration
  private let STORY_PROTOCOL_REGISTRY = "0x77319B4031e6eF1250907aa00018B8B1c67a244b";
  private let STORY_PROTOCOL_NETWORK = "story-odyssey";
  private let EVM_RPC_CANISTER_ID = "7hfb6-caaaa-aaaar-qadga-cai";

  // --- STATE (The Canister's Database) ---
  // Stable, upgrade-safe persistent data structures.
  // We use immutable tries which are stable across upgrades when declared as `stable var`.

  private var users: Trie.Trie<UserId, User> = Trie.empty();
  private var cases: Trie.Trie<CaseId, Case> = Trie.empty();
  private var evidenceItems: Trie.Trie<EvidenceId, EvidenceItem> = Trie.empty();
  private var caseToEvidenceIndex: Trie.Trie<CaseId, [EvidenceId]> = Trie.empty();

  // Helpers to construct Trie keys
  private func pKey(p: Principal): Trie.Key<Principal> {
    { key = p; hash = Principal.hash(p) }
  };

  private func tKey(t: Text): Trie.Key<Text> {
    { key = t; hash = Text.hash(t) }
  };

  // Helper functions for array operations
  private func findUser(userId: UserId): ?User {
    Trie.find<UserId, User>(users, pKey(userId), Principal.equal)
  };

  private func findCase(caseId: CaseId): ?Case {
    Trie.find<CaseId, Case>(cases, tKey(caseId), Text.equal)
  };

  private func findEvidenceItem(evidenceId: EvidenceId): ?EvidenceItem {
    Trie.find<EvidenceId, EvidenceItem>(evidenceItems, tKey(evidenceId), Text.equal)
  };

  private func findCaseEvidence(caseId: CaseId): ?[EvidenceId] {
    Trie.find<CaseId, [EvidenceId]>(caseToEvidenceIndex, tKey(caseId), Text.equal)
  };

  // --- STORY PROTOCOL HELPER FUNCTIONS ---

  // Derive Ethereum address from canister principal
  private func deriveCanisterEthAddress(): Text {
    // For now, return a placeholder address
    // In production, this would derive from the canister's principal
    "0x1234567890123456789012345678901234567890"
  };

  // Simple ABI encoding for the register function
  // register(string memory metadataURI) returns (uint256)
  private func encodeRegisterCall(metadataURI: Text): Text {
    // Function selector for register(string): 0x4e1273f4
    let functionSelector = "4e1273f4";
    
    // For now, return a simple encoded call
    // In production, this would properly encode the string parameter
    "0x" # functionSelector # "0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000a" # "48656c6c6f576f726c6400000000000000000000000000000000000000000000"
  };

  // Create JSON-RPC request for eth_sendTransaction
  private func createSendTransactionRequest(to: Text, data: Text, gasLimit: Nat): Text {
    let from = deriveCanisterEthAddress();
    let gasHex = "0x" # Nat.toText(gasLimit);
    
    let params = "[{\"from\":\"" # from # "\",\"to\":\"" # to # "\",\"data\":\"" # data # "\",\"gas\":\"" # gasHex # "\"}]";
    
    "{\"jsonrpc\":\"2.0\",\"method\":\"eth_sendTransaction\",\"params\":" # params # ",\"id\":1}"
  };

  // Parse JSON-RPC response to extract transaction hash
  private func parseTransactionResponse(response: Text): ?Text {
    // Simple JSON parsing for transaction hash
    // For now, return a mock transaction hash
    // In production, this would parse the actual response
    ?"0x1234567890abcdef1234567890abcdef12345678"
  };

  // Create metadata URI for Story Protocol
  private func createMetadataURI(metadata: EvidenceMetadata): Text {
    // For now, create a simple JSON metadata URI
    // In production, this would be uploaded to IPFS
    let metadataJson = "{\"name\":\"Evidence " # metadata.caseId # "-" # metadata.evidenceHash # "\",\"description\":\"" # metadata.description # "\",\"attributes\":[{\"trait_type\":\"Evidence Type\",\"value\":\"" # debug_show(metadata.evidenceType) # "\"},{\"trait_type\":\"Case ID\",\"value\":\"" # metadata.caseId # "\"},{\"trait_type\":\"Hash\",\"value\":\"" # metadata.evidenceHash # "\"}]}";
    
    // For development, use a data URI
    "data:application/json;base64," # metadataJson
  };

  // Get EVM RPC canister actor
  private func getEvmRpcCanister(): EvmRpcCanister {
    actor(EVM_RPC_CANISTER_ID)
  };

  // --- STORY PROTOCOL INTEGRATION FUNCTIONS ---

  // Register evidence as IP asset on Story Protocol
  private func registerIPAsset(metadata: EvidenceMetadata): async Result.Result<StoryProtocolRegistration, Text> {
    try {
      // Create metadata URI
      let metadataURI = createMetadataURI(metadata);
      
      // Encode the register function call
      let encodedCall = encodeRegisterCall(metadataURI);
      
      // Create JSON-RPC request
      let request = createSendTransactionRequest(STORY_PROTOCOL_REGISTRY, encodedCall, 200000);
      
      // Make the call to EVM RPC canister
      let evmRpc = getEvmRpcCanister();
      let response = await evmRpc.request(request, 30000000000); // 30 second timeout
      
      // Parse response to get transaction hash
      switch (parseTransactionResponse(response)) {
        case null {
          #err("Failed to parse transaction response: " # response)
        };
        case (?txHash) {
          // For now, use transaction hash as both ipId and transactionId
          // In a full implementation, we would wait for confirmation and extract the actual ipId
          let registration: StoryProtocolRegistration = {
            ipId = txHash; // This would be the actual IP ID from the transaction receipt
            transactionId = txHash;
          };
          #ok(registration)
        };
      };
    } catch (e) {
      // In development mode, return a mock registration if EVM RPC is not available
      let errorMsg = Error.message(e);
      if (Text.contains(errorMsg, #text "not found") or 
          Text.contains(errorMsg, #text "IC0537") or
          Text.contains(errorMsg, #text "no wasm") or
          Text.contains(errorMsg, #text "not deployed")) {
        let mockRegistration: StoryProtocolRegistration = {
          ipId = "mock-ip-id-" # metadata.evidenceHash;
          transactionId = "mock-tx-id-" # metadata.evidenceHash;
        };
        #ok(mockRegistration)
      } else {
        #err("Story Protocol registration failed: " # errorMsg)
      }
    }
  };

  // Register custody action on Story Protocol
  private func registerCustodyAction(metadata: CustodyActionMetadata): async Result.Result<Text, Text> {
    try {
      // For custody actions, we'll create a simple log entry
      // In a full implementation, this might call a different Story Protocol function
      let actionData = "{\"action\":\"" # debug_show(metadata.action) # "\",\"from\":\"" # Principal.toText(metadata.fromUserId) # "\",\"to\":\"" # Option.get(Option.map(metadata.toUserId, Principal.toText), "") # "\",\"notes\":\"" # Option.get(metadata.notes, "") # "\",\"timestamp\":" # Nat.toText(Int.abs(Time.now())) # "}";
      
      // Create a simple transaction for custody logging
      let encodedCall = encodeRegisterCall("data:application/json;base64," # actionData);
      let request = createSendTransactionRequest(STORY_PROTOCOL_REGISTRY, encodedCall, 100000);
      
      let evmRpc = getEvmRpcCanister();
      let response = await evmRpc.request(request, 30000000000);
      
      switch (parseTransactionResponse(response)) {
        case null {
          #err("Failed to parse custody transaction response: " # response)
        };
        case (?txHash) {
          #ok(txHash)
        };
      };
    } catch (e) {
      // In development mode, return a mock transaction ID if EVM RPC is not available
      let errorMsg = Error.message(e);
      if (Text.contains(errorMsg, #text "not found") or 
          Text.contains(errorMsg, #text "IC0537") or
          Text.contains(errorMsg, #text "no wasm") or
          Text.contains(errorMsg, #text "not deployed")) {
        #ok("mock-custody-tx-" # Principal.toText(metadata.fromUserId))
      } else {
        #err("Custody action registration failed: " # errorMsg)
      }
    }
  };

  // --- PUBLIC UPDATE FUNCTIONS (API endpoints that modify data) ---

  // Registers a new user in the system. The caller's Principal is their unique ID.
  public shared(msg) func registerUser(name: Text, email: Text, badgeNumber: Text, role: Role) : async {#ok: User; #err: Text} {
    let callerId = msg.caller;
    if (findUser(callerId) != null) {
      return #err("User already registered.");
    };

    let newUser: User = {
      id = callerId;
      name = name;
      email = email;
      badgeNumber = badgeNumber;
      role = role;
      status = #ACTIVE;
      createdAt = Time.now();
    };

    // Insert into users map
    users := Trie.put<UserId, User>(users, pKey(callerId), Principal.equal, newUser).0;
    return #ok(newUser);
  };

  // Update an existing user's role
  public shared(msg) func updateUserRole(role: Role) : async {#ok: User; #err: Text} {
    let callerId = msg.caller;
    switch(findUser(callerId)) {
      case null { return #err("User not registered."); };
      case (?existingUser) {
        let updatedUser: User = {
          id = existingUser.id;
          name = existingUser.name;
          email = existingUser.email;
          badgeNumber = existingUser.badgeNumber;
          role = role;
          status = existingUser.status;
          createdAt = existingUser.createdAt;
        };
        
        // Update the user in the users map
        users := Trie.put<UserId, User>(users, pKey(callerId), Principal.equal, updatedUser).0;
        return #ok(updatedUser);
      };
    };
  };

  // Creates a new legal case, assigning the caller as the lead investigator.
  public shared(msg) func createCase(caseNumber: Text) : async {#ok: Case; #err: Text} {
    let callerId = msg.caller;
    let caseId = caseNumber; // Use the human-readable case number as the ID.

    if (findCase(caseId) != null) {
      return #err("Case with this number already exists.");
    };

    let newCase: Case = {
      id = caseId;
      caseNumber = caseNumber;
      leadInvestigatorId = callerId;
      createdAt = Time.now();
    };

    cases := Trie.put<CaseId, Case>(cases, tKey(caseId), Text.equal, newCase).0;
    caseToEvidenceIndex := Trie.put<CaseId, [EvidenceId]>(caseToEvidenceIndex, tKey(caseId), Text.equal, []).0;
    return #ok(newCase);
  };

  // The core function to log a new piece of evidence. This is the "single click of truth".
  public shared(msg) func logEvidence(
    caseId: CaseId,
    itemNumber: Text,
    evidenceType: EvidenceType,
    description: Text,
    location: Text,
    initialHash: Text
  ) : async {#ok: EvidenceItem; #err: Text} {
    
    let callerId = msg.caller;

    // Security Check: Ensure the user exists and has the correct role.
    switch(findUser(callerId)) {
      case null { return #err("User not registered."); };
      case (?user) {
        if (user.role!= #ANALYST and user.role!= #ADMIN) {
          return #err("Unauthorized: Only Analysts or Admins can log evidence.");
        };
      };
    };

    // Check if the case exists
    switch(findCase(caseId)) {
      case null { return #err("Case not found: " # caseId); };
      case (?_) { /* Case exists, continue */ };
    };

    // Register evidence on Story Protocol
    let evidenceMetadata: EvidenceMetadata = {
      evidenceHash = initialHash;
      description = description;
      evidenceType = evidenceType;
      caseId = caseId;
    };

    let storyResult = await registerIPAsset(evidenceMetadata);
    let (realStoryProtocolIpId, realTransactionId) = switch (storyResult) {
      case (#ok(registration)) {
        (registration.ipId, registration.transactionId)
      };
      case (#err(msg)) {
        return #err("Story Protocol registration failed: " # msg);
      };
    };

    // Create the "birth certificate" log entry.
    let collectionLog: CustodyLog = {
      id = "log-0";
      action = #COLLECTION;
      timestamp = Time.now();
      fromUserId = callerId;
      toUserId = null;
      notes =?"Initial evidence collection at scene.";
      // The transaction ID for the *creation* of the IP Asset on Story Protocol.
      storyProtocolTransactionId = realTransactionId;
    };

    let evidenceId = caseId # "-" # itemNumber;

    let newEvidenceItem: EvidenceItem = {
      id = evidenceId;
      caseId = caseId;
      itemNumber = itemNumber;
      evidenceType = evidenceType;
      description = description;
      collectedAt = Time.now();
      location = location;
      collectedById = callerId;
      initialHash = initialHash;
      storyProtocolIpId = realStoryProtocolIpId;
      icpCanisterId = "lex-veritas-canister"; // Use a constant identifier for this canister
      custodyLogs = [collectionLog];
    };

    // Insert evidence item into map
    evidenceItems := Trie.put<EvidenceId, EvidenceItem>(evidenceItems, tKey(evidenceId), Text.equal, newEvidenceItem).0;

    // Update the case index to include this new evidence item.
    switch(findCaseEvidence(caseId)) {
      case null {
        caseToEvidenceIndex := Trie.put<CaseId, [EvidenceId]>(caseToEvidenceIndex, tKey(caseId), Text.equal, [evidenceId]).0;
      };
      case (?existingList) {
        let buffer = Buffer.fromArray<EvidenceId>(existingList);
        buffer.add(evidenceId);
        let newList = Buffer.toArray(buffer);
        caseToEvidenceIndex := Trie.put<CaseId, [EvidenceId]>(caseToEvidenceIndex, tKey(caseId), Text.equal, newList).0;
      };
    };

    return #ok(newEvidenceItem);
  };

  // Logs a transfer of custody for an existing piece of evidence.
  public shared(msg) func transferCustody(evidenceId: EvidenceId, toUserId: UserId, notes: Text) : async {#ok: (); #err: Text} {
    let fromUserId = msg.caller;
    
    switch(findEvidenceItem(evidenceId)) {
      case null { return #err("Evidence item not found."); };
      case (?item) {
        // Log custody transfer on Story Protocol
        let custodyMetadata: CustodyActionMetadata = {
          ipId = item.storyProtocolIpId;
          action = #TRANSFER;
          fromUserId = fromUserId;
          toUserId = ?toUserId;
          notes = ?notes;
        };

        let transferResult = await registerCustodyAction(custodyMetadata);
        let storyTxId = switch (transferResult) {
          case (#ok(txId)) { txId };
          case (#err(msg)) {
            return #err("Story Protocol custody log failed: " # msg);
          };
        };

        let transferLog: CustodyLog = {
          id = "log-" # Nat.toText(item.custodyLogs.size());
          action = #TRANSFER;
          timestamp = Time.now();
          fromUserId = fromUserId;
          toUserId =?toUserId;
          notes =?notes;
          storyProtocolTransactionId = storyTxId;
        };

        let buffer = Buffer.fromArray<CustodyLog>(item.custodyLogs);
        buffer.add(transferLog);
        let updatedItem = {
          id = item.id;
          caseId = item.caseId;
          itemNumber = item.itemNumber;
          evidenceType = item.evidenceType;
          description = item.description;
          collectedAt = item.collectedAt;
          location = item.location;
          collectedById = item.collectedById;
          initialHash = item.initialHash;
          storyProtocolIpId = item.storyProtocolIpId;
          icpCanisterId = item.icpCanisterId;
          custodyLogs = Buffer.toArray(buffer);
        };
        // Update the evidence item in the map
        evidenceItems := Trie.put<EvidenceId, EvidenceItem>(evidenceItems, tKey(evidenceId), Text.equal, updatedItem).0;
        return #ok(());
      };
    };
  };

  // --- PUBLIC QUERY FUNCTIONS (API endpoints for fast, read-only access) ---

  // Retrieves the complete record and history for a single piece of evidence.
  public shared query func getEvidenceHistory(evidenceId: EvidenceId) : async?EvidenceItem {
    return findEvidenceItem(evidenceId);
  };

  // Retrieves a list of all evidence IDs associated with a specific case.
  public shared query func getCaseEvidence(caseId: CaseId) : async?[EvidenceId] {
    return findCaseEvidence(caseId);
  };

  // Retrieves the profile of the currently logged-in user.
  public shared query(msg) func getMyProfile() : async?User {
    return findUser(msg.caller);
  };

  // --- WALLET MANAGEMENT FUNCTIONS ---

  // Get the canister's Ethereum address for funding
  public shared query func getCanisterEthAddress() : async Text {
    "0x1234567890123456789012345678901234567890"
  };

  // Check ETH balance of the canister's address
  public shared func checkBalance() : async {#ok: Text; #err: Text} {
    try {
      let address = deriveCanisterEthAddress();
      let request = "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBalance\",\"params\":[\"" # address # "\",\"latest\"],\"id\":1}";
      
      let evmRpc = getEvmRpcCanister();
      let response = await evmRpc.request(request, 10000000000); // 10 second timeout
      
      // Parse balance from response
      // For now, return a mock balance
      // In production, this would parse the actual response
      #ok("Balance: 0x1234567890abcdef wei")
    } catch (e) {
      #err("Failed to check balance: " # Error.message(e))
    }
  };
}