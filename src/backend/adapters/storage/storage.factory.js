import { HostingerAdapter } from "./hostinger.adapter";

// ============================================
// STORAGE PROVIDER FACTORY (Hostinger only)
// ============================================

export function createStorageProvider() {
  const provider = (
    process.env.STORAGE_PROVIDER || "hostinger"
  ).toLowerCase();

  if (provider !== "hostinger") {
    throw new Error(
      `Unsupported storage provider "${provider}". Only hostinger is supported.`,
    );
  }

  return new HostingerAdapter();
}

export function getStorageProviderName() {
  return "hostinger";
}
