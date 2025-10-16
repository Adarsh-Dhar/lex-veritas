import { Actor, HttpAgent } from "@dfinity/agent";
import { IDL } from "@dfinity/candid";
import { Principal } from "@dfinity/principal";

// Environment configuration
const RAW_CONTRACT_CANISTER_ID = process.env.NEXT_PUBLIC_CONTRACT_BACKEND_CANISTER_ID;
const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST ?? "https://icp0.io";

if (!RAW_CONTRACT_CANISTER_ID) {
  // Fail fast so consumers know env is missing
  // eslint-disable-next-line no-console
  console.warn(
    "Missing NEXT_PUBLIC_CONTRACT_BACKEND_CANISTER_ID. Set it in your environment to enable canister calls."
  );
}

// Normalize and validate canister id early for clearer errors
let CONTRACT_CANISTER_ID_PRINCIPAL: Principal | null = null;
let CONTRACT_CANISTER_ID_TEXT: string | null = null;

function extractCanisterId(raw: string): string | null {
  const cleaned = raw.trim().replace(/^['"]|['"]$/g, "");
  try {
    // Case 1: Full URL
    if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
      const url = new URL(cleaned);
      const id = url.searchParams.get("id") || url.searchParams.get("canisterId");
      if (id) return id;
    }
  } catch (_) {
    // ignore URL parsing failures
  }

  // Case 2: Query-string like input
  if (cleaned.includes("=") && cleaned.includes("&")) {
    const qs = cleaned.startsWith("?") ? cleaned : `?${cleaned}`;
    const params = new URLSearchParams(qs);
    const idParam = params.get("id");
    if (idParam) return idParam;
    const canisterParam = params.get("canisterId");
    if (canisterParam) return canisterParam;
  }

  // Case 3: Fall back to scanning tokens for a valid principal
  const tokens = cleaned.split(/[^a-z0-9-]+/i).filter(Boolean);
  for (const token of tokens) {
    try {
      Principal.fromText(token);
      return token; // first valid principal-looking token
    } catch {
      // try next token
    }
  }

  // Case 4: Try the entire cleaned string as-is
  try {
    Principal.fromText(cleaned);
    return cleaned;
  } catch {
    return null;
  }
}

try {
  if (RAW_CONTRACT_CANISTER_ID) {
    const extracted = extractCanisterId(RAW_CONTRACT_CANISTER_ID);
    if (extracted) {
      CONTRACT_CANISTER_ID_TEXT = extracted;
      CONTRACT_CANISTER_ID_PRINCIPAL = Principal.fromText(extracted);
    }
  }
} catch (e) {
  // eslint-disable-next-line no-console
  console.error(
    `Invalid NEXT_PUBLIC_CONTRACT_BACKEND_CANISTER_ID: "${RAW_CONTRACT_CANISTER_ID}". Ensure it is a valid canister principal (e.g., ryjl3-tyaaa-aaaaa-aaaba-cai).`,
    e
  );
}

// -------------------------
// Candid IDL and TS Types
// -------------------------

// Discriminated unions matching Candid variants
export type Role = { ADMIN: null } | { ANALYST: null } | { PROSECUTOR: null } | { AUDITOR: null };
export type UserStatus = { ACTIVE: null } | { INACTIVE: null } | { SUSPENDED: null };
export type EvidenceType =
  | { LAPTOP_HARD_DRIVE: null }
  | { MOBILE_PHONE: null }
  | { USB_DRIVE: null }
  | { SURVEILLANCE_FOOTAGE: null }
  | { CLOUD_DATA: null }
  | { DOCUMENT: null }
  | { OTHER: null };
export type CustodyAction =
  | { COLLECTION: null }
  | { TRANSFER: null }
  | { ANALYSIS: null }
  | { VIEW: null }
  | { SUBMITTED_TO_COURT: null }
  | { ARCHIVED: null };

export type User = {
  id: string; // Principal as text
  name: string;
  email: string;
  badgeNumber: string;
  role: Role;
  status: UserStatus;
  createdAt: bigint;
};

export type Case = {
  id: string;
  caseNumber: string;
  leadInvestigatorId: string; // Principal as text
  createdAt: bigint;
};

export type CustodyLog = {
  id: string;
  action: CustodyAction;
  timestamp: bigint;
  fromUserId: string; // Principal as text
  toUserId?: string | null; // Principal as text
  notes?: string | null;
  storyProtocolTransactionId: string;
};

export type EvidenceItem = {
  id: string;
  caseId: string;
  itemNumber: string;
  evidenceType: EvidenceType;
  description: string;
  collectedAt: bigint;
  location: string;
  collectedById: string; // Principal as text
  initialHash: string;
  storyProtocolIpId: string;
  icpCanisterId: string;
  custodyLogs: CustodyLog[];
};

export type ResultOk<T> = { ok: T };
export type ResultErr = { err: string };
export type Result<T> = ResultOk<T> | ResultErr;

// Candid IDL factory that matches Motoko definitions in contract_backend
export const idlFactory: IDL.InterfaceFactory = ({ IDL }) => {
  const Role = IDL.Variant({ ADMIN: IDL.Null, ANALYST: IDL.Null, PROSECUTOR: IDL.Null, AUDITOR: IDL.Null });
  const UserStatus = IDL.Variant({ ACTIVE: IDL.Null, INACTIVE: IDL.Null, SUSPENDED: IDL.Null });
  const EvidenceType = IDL.Variant({
    LAPTOP_HARD_DRIVE: IDL.Null,
    MOBILE_PHONE: IDL.Null,
    USB_DRIVE: IDL.Null,
    SURVEILLANCE_FOOTAGE: IDL.Null,
    CLOUD_DATA: IDL.Null,
    DOCUMENT: IDL.Null,
    OTHER: IDL.Null,
  });
  const CustodyAction = IDL.Variant({
    COLLECTION: IDL.Null,
    TRANSFER: IDL.Null,
    ANALYSIS: IDL.Null,
    VIEW: IDL.Null,
    SUBMITTED_TO_COURT: IDL.Null,
    ARCHIVED: IDL.Null,
  });

  const User = IDL.Record({
    id: IDL.Principal,
    name: IDL.Text,
    email: IDL.Text,
    badgeNumber: IDL.Text,
    role: Role,
    status: UserStatus,
    createdAt: IDL.Int,
  });

  const Case = IDL.Record({
    id: IDL.Text,
    caseNumber: IDL.Text,
    leadInvestigatorId: IDL.Principal,
    createdAt: IDL.Int,
  });

  const CustodyLog = IDL.Record({
    id: IDL.Text,
    action: CustodyAction,
    timestamp: IDL.Int,
    fromUserId: IDL.Principal,
    toUserId: IDL.Opt(IDL.Principal),
    notes: IDL.Opt(IDL.Text),
    storyProtocolTransactionId: IDL.Text,
  });

  const EvidenceItem = IDL.Record({
    id: IDL.Text,
    caseId: IDL.Text,
    itemNumber: IDL.Text,
    evidenceType: EvidenceType,
    description: IDL.Text,
    collectedAt: IDL.Int,
    location: IDL.Text,
    collectedById: IDL.Principal,
    initialHash: IDL.Text,
    storyProtocolIpId: IDL.Text,
    icpCanisterId: IDL.Text,
    custodyLogs: IDL.Vec(CustodyLog),
  });

  const ResultUser = IDL.Variant({ ok: User, err: IDL.Text });
  const ResultCase = IDL.Variant({ ok: Case, err: IDL.Text });
  const ResultEvidenceItem = IDL.Variant({ ok: EvidenceItem, err: IDL.Text });
  const ResultUnit = IDL.Variant({ ok: IDL.Null, err: IDL.Text });

  return IDL.Service({
    registerUser: IDL.Func([IDL.Text, IDL.Text, IDL.Text, Role], [ResultUser], []),
    createCase: IDL.Func([IDL.Text], [ResultCase], []),
    logEvidence: IDL.Func(
      [IDL.Text, IDL.Text, EvidenceType, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text],
      [ResultEvidenceItem],
      []
    ),
    transferCustody: IDL.Func([IDL.Text, IDL.Principal, IDL.Text], [ResultUnit], []),
    getEvidenceHistory: IDL.Func([IDL.Text], [IDL.Opt(EvidenceItem)], ["query"]),
    getCaseEvidence: IDL.Func([IDL.Text], [IDL.Opt(IDL.Vec(IDL.Text))], ["query"]),
    getMyProfile: IDL.Func([], [IDL.Opt(User)], ["query"]),
  });
};

// -------------------------
// Actor and wrappers
// -------------------------

export interface ContractService {
  registerUser: (
    name: string,
    email: string,
    badgeNumber: string,
    role: Role
  ) => Promise<Result<User>>;
  createCase: (caseNumber: string) => Promise<Result<Case>>;
  logEvidence: (
    caseId: string,
    itemNumber: string,
    evidenceType: EvidenceType,
    description: string,
    location: string,
    initialHash: string,
    storyProtocolIpId: string,
    icpCanisterId: string
  ) => Promise<Result<EvidenceItem>>;
  transferCustody: (evidenceId: string, toUserId: Principal, notes: string) => Promise<Result<null>>;
  getEvidenceHistory: (evidenceId: string) => Promise<[] | [EvidenceItem]>;
  getCaseEvidence: (caseId: string) => Promise<[] | [string[]]>;
  getMyProfile: () => Promise<[] | [User]>;
}

let cachedActor: ContractService | null = null;
let cachedIdentityActor: WeakMap<object, ContractService> | null = null;

export async function getContractActor(): Promise<ContractService> {
  if (cachedActor) return cachedActor;
  if (!CONTRACT_CANISTER_ID_PRINCIPAL) throw new Error("Canister ID not configured or invalid");

  const agent = new HttpAgent({ host: IC_HOST });
  // In local development fetch the replica root key to enable cert verification
  if (IC_HOST.includes("127.0.0.1") || IC_HOST.includes("localhost")) {
    await agent.fetchRootKey();
  }

  const actor = Actor.createActor<ContractService>(idlFactory, {
  agent,
    canisterId: CONTRACT_CANISTER_ID_PRINCIPAL,
  });

  cachedActor = actor;
  return actor;
}

export async function createAuthenticatedContractActor(identity: unknown): Promise<ContractService> {
  if (!CONTRACT_CANISTER_ID_PRINCIPAL) throw new Error("Canister ID not configured or invalid");

  if (!cachedIdentityActor) {
    cachedIdentityActor = new WeakMap();
  }

  const existing = cachedIdentityActor.get(identity as object);
  if (existing) return existing;

  const agent = new HttpAgent({ host: IC_HOST, identity: identity as any });
  // In local development fetch the replica root key to enable cert verification
  if (IC_HOST.includes("127.0.0.1") || IC_HOST.includes("localhost")) {
    await agent.fetchRootKey();
  }

  const actor = Actor.createActor<ContractService>(idlFactory, {
    agent,
    canisterId: CONTRACT_CANISTER_ID_PRINCIPAL,
  });

  cachedIdentityActor.set(identity as object, actor);
  return actor;
}

export function resetContractActorCache(): void {
  cachedActor = null;
  cachedIdentityActor = null;
}

// Helper creators for variants
export const RoleEnum = {
  ADMIN: { ADMIN: null } as Role,
  ANALYST: { ANALYST: null } as Role,
  PROSECUTOR: { PROSECUTOR: null } as Role,
  AUDITOR: { AUDITOR: null } as Role,
};

export const EvidenceTypeEnum = {
  LAPTOP_HARD_DRIVE: { LAPTOP_HARD_DRIVE: null } as EvidenceType,
  MOBILE_PHONE: { MOBILE_PHONE: null } as EvidenceType,
  USB_DRIVE: { USB_DRIVE: null } as EvidenceType,
  SURVEILLANCE_FOOTAGE: { SURVEILLANCE_FOOTAGE: null } as EvidenceType,
  CLOUD_DATA: { CLOUD_DATA: null } as EvidenceType,
  DOCUMENT: { DOCUMENT: null } as EvidenceType,
  OTHER: { OTHER: null } as EvidenceType,
};

// -------------------------
// High-level wrappers
// -------------------------

export async function registerUser(params: {
  name: string;
  email: string;
  badgeNumber: string;
  role: Role;
}): Promise<Result<User>> {
  const actor = await getContractActor();
  return actor.registerUser(params.name, params.email, params.badgeNumber, params.role);
}

export async function createCase(caseNumber: string): Promise<Result<Case>> {
  const actor = await getContractActor();
  return actor.createCase(caseNumber);
}

export async function logEvidence(params: {
  caseId: string;
  itemNumber: string;
  evidenceType: EvidenceType;
  description: string;
  location: string;
  initialHash: string;
  storyProtocolIpId: string;
  icpCanisterId: string;
}): Promise<Result<EvidenceItem>> {
  const actor = await getContractActor();
  return actor.logEvidence(
    params.caseId,
    params.itemNumber,
    params.evidenceType,
    params.description,
    params.location,
    params.initialHash,
    params.storyProtocolIpId,
    params.icpCanisterId
  );
}

export async function transferCustody(params: {
  evidenceId: string;
  toUserId: string; // Principal text
  notes: string;
}): Promise<Result<null>> {
  const actor = await getContractActor();
  const toPrincipal = Principal.fromText(params.toUserId);
  return actor.transferCustody(params.evidenceId, toPrincipal, params.notes);
}

export async function getEvidenceHistory(evidenceId: string): Promise<EvidenceItem | null> {
  const actor = await getContractActor();
  const res = await actor.getEvidenceHistory(evidenceId);
  const [value] = res;
  return value ?? null;
}

export async function getCaseEvidence(caseId: string): Promise<string[] | null> {
  const actor = await getContractActor();
  const res = await actor.getCaseEvidence(caseId);
  const [value] = res;
  return value ?? null;
}

export async function getMyProfile(): Promise<User | null> {
  const actor = await getContractActor();
  const res = await actor.getMyProfile();
  const [value] = res;
  return value ?? null;
}