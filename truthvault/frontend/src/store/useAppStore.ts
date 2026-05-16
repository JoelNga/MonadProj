import { create } from "zustand";

export interface EvidenceRecord {
  fileHashes: string[];
  ipfsCIDs: string[];
  timestamp: bigint;
  owner: string;
  metadataURI: string;
  zkVerified: boolean;
  lastActiveAt: bigint;
  inactivityPeriod: bigint;
  isPublic: boolean;
  nftTokenId: bigint;
  title: string;
  description: string;
  isImmediate: boolean;
}

interface UploadState {
  files: File[];
  encryptionKeys: string[];
  ipfsCIDs: string[];
  fileHashes: `0x${string}`[];
  txHash: string | null;
  nftTokenId: bigint | null;
  inactivityPeriod: number;
  zkProof: object | null;
  records: EvidenceRecord[];
  title: string;
  description: string;
  isImmediate: boolean;
}

interface AppStore extends UploadState {
  setFiles: (files: File[]) => void;
  addFiles: (files: File[]) => void;
  removeFile: (index: number) => void;
  setEncryptionKeys: (keys: string[]) => void;
  setIPFSCIDs: (cids: string[]) => void;
  setFileHashes: (hashes: `0x${string}`[]) => void;
  setTxHash: (hash: string | null) => void;
  setNFTTokenId: (id: bigint | null) => void;
  setInactivityPeriod: (seconds: number) => void;
  setZKProof: (proof: object | null) => void;
  setRecords: (records: EvidenceRecord[]) => void;
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setIsImmediate: (isImmediate: boolean) => void;
  reset: () => void;
}

const initial: UploadState = {
  files: [],
  encryptionKeys: [],
  ipfsCIDs: [],
  fileHashes: [],
  txHash: null,
  nftTokenId: null,
  inactivityPeriod: 86400,
  zkProof: null,
  records: [],
  title: "",
  description: "",
  isImmediate: false,
};

export const useAppStore = create<AppStore>(set => ({
  ...initial,
  setFiles: files => set({ files }),
  addFiles: files => set(state => ({ files: [...state.files, ...files] })),
  removeFile: index => set(state => ({
    files: state.files.filter((_, i) => i !== index),
  })),
  setEncryptionKeys: encryptionKeys => set({ encryptionKeys }),
  setIPFSCIDs: ipfsCIDs => set({ ipfsCIDs }),
  setFileHashes: fileHashes => set({ fileHashes }),
  setTxHash: txHash => set({ txHash }),
  setNFTTokenId: nftTokenId => set({ nftTokenId }),
  setInactivityPeriod: inactivityPeriod => set({ inactivityPeriod }),
  setZKProof: zkProof => set({ zkProof }),
  setRecords: records => set({ records }),
  setTitle: title => set({ title }),
  setDescription: description => set({ description }),
  setIsImmediate: isImmediate => set({ isImmediate }),
  reset: () => set(initial),
}));
