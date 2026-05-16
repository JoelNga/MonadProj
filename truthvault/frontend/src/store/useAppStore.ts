import { create } from "zustand";

export interface EvidenceRecord {
  fileHash: string;
  ipfsCID: string;
  timestamp: bigint;
  owner: string;
  metadataURI: string;
  zkVerified: boolean;
  lastActiveAt: bigint;
  inactivityPeriod: bigint;
  isPublic: boolean;
  nftTokenId: bigint;
}

interface UploadState {
  file: File | null;
  encryptionKey: string | null;
  ipfsCID: string | null;
  fileHash: `0x${string}` | null;
  txHash: string | null;
  nftTokenId: bigint | null;
  inactivityPeriod: number;
  zkProof: object | null;
  records: EvidenceRecord[];
}

interface AppStore extends UploadState {
  setFile: (file: File | null) => void;
  setEncryptionKey: (key: string | null) => void;
  setIPFSCID: (cid: string | null) => void;
  setFileHash: (hash: `0x${string}` | null) => void;
  setTxHash: (hash: string | null) => void;
  setNFTTokenId: (id: bigint | null) => void;
  setInactivityPeriod: (seconds: number) => void;
  setZKProof: (proof: object | null) => void;
  setRecords: (records: EvidenceRecord[]) => void;
  reset: () => void;
}

const initial: UploadState = {
  file: null,
  encryptionKey: null,
  ipfsCID: null,
  fileHash: null,
  txHash: null,
  nftTokenId: null,
  inactivityPeriod: 7776000,
  zkProof: null,
  records: [],
};

export const useAppStore = create<AppStore>(set => ({
  ...initial,
  setFile: file => set({ file }),
  setEncryptionKey: encryptionKey => set({ encryptionKey }),
  setIPFSCID: ipfsCID => set({ ipfsCID }),
  setFileHash: fileHash => set({ fileHash }),
  setTxHash: txHash => set({ txHash }),
  setNFTTokenId: nftTokenId => set({ nftTokenId }),
  setInactivityPeriod: inactivityPeriod => set({ inactivityPeriod }),
  setZKProof: zkProof => set({ zkProof }),
  setRecords: records => set({ records }),
  reset: () => set(initial),
}));