// This is the main canister smart contract for the Lex Veritas 2.0 application.
// It is designed to directly implement the logic and data structures from the provided Prisma schema.
// All data is stored in stable memory, ensuring it persists across canister upgrades.

import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Buffer "mo:base/Buffer";
import Text "mo:base/Text";
import Trie "mo:base/Trie";

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
    initialHash: Text,
    storyProtocolIpId: Text,
    icpCanisterId: Text
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

    // Create the "birth certificate" log entry.
    let collectionLog: CustodyLog = {
      id = "log-0";
      action = #COLLECTION;
      timestamp = Time.now();
      fromUserId = callerId;
      toUserId = null;
      notes =?"Initial evidence collection at scene.";
      // The transaction ID for the *creation* of the IP Asset on Story Protocol.
      storyProtocolTransactionId = "tx_for_" # storyProtocolIpId;
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
      storyProtocolIpId = storyProtocolIpId;
      icpCanisterId = icpCanisterId;
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
        // In a real app, this would make an inter-canister call to a Story Protocol proxy
        // to log the transfer and get a new transaction ID.
        let storyTxId : Text = "mock_story_tx_id_for_transfer_" # Nat.toText(item.custodyLogs.size());

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
}