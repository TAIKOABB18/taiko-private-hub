import { HubApiClient } from "./api-client";

type SavedUpload = { uploadId: string; fileId: string; projectId: string; name: string; size: number; partSize: number; completed: Record<number, { etag: string; sizeBytes: number }> };
const DB_NAME = "taiko-private-hub-uploads";

function openDb(): Promise<IDBDatabase> { return new Promise((resolve, reject) => { const req = indexedDB.open(DB_NAME, 1); req.onupgradeneeded = () => req.result.createObjectStore("uploads", { keyPath: "uploadId" }); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }); }
async function save(record: SavedUpload) { const db = await openDb(); await new Promise<void>((resolve, reject) => { const tx = db.transaction("uploads", "readwrite"); tx.objectStore("uploads").put(record); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); }); }

export class MultipartUploader {
  private paused = false;
  private cancelled = false;
  private active = new Set<AbortController>();
  constructor(private readonly api: HubApiClient, private readonly projectId: string, private readonly file: File, private readonly concurrency = 3) {}
  pause() { this.paused = true; for (const controller of this.active) controller.abort(); }
  resume() { this.paused = false; }
  cancel() { this.cancelled = true; for (const controller of this.active) controller.abort(); }
  async start(onProgress: (uploadedBytes: number, totalBytes: number) => void) {
    const init = await this.api.uploadInit(this.projectId, { filename: this.file.name, contentType: this.file.type || "application/octet-stream", sizeBytes: this.file.size });
    const record: SavedUpload = { uploadId: init.uploadId, fileId: init.fileId, projectId: this.projectId, name: this.file.name, size: this.file.size, partSize: init.partSizeBytes, completed: {} };
    await save(record); return this.resumeExisting(record, onProgress);
  }
  async resumeExisting(record: SavedUpload, onProgress: (uploadedBytes: number, totalBytes: number) => void) {
    const state = await this.api.uploadState(record.uploadId); const completed = { ...record.completed }; for (const part of state.parts) completed[part.partNumber] = { etag: part.etag, sizeBytes: part.sizeBytes };
    const count = Math.ceil(this.file.size / record.partSize); const pending = Array.from({ length: count }, (_, i) => i + 1).filter((part) => !completed[part]);
    let uploaded = Object.values(completed).reduce((sum, part) => sum + part.sizeBytes, 0); onProgress(uploaded, this.file.size);
    const worker = async () => { while (pending.length && !this.cancelled) { while (this.paused && !this.cancelled) await new Promise((resolve) => setTimeout(resolve, 250)); if (this.cancelled) break; const partNumber = pending.shift()!; const start = (partNumber - 1) * record.partSize; const body = this.file.slice(start, Math.min(start + record.partSize, this.file.size)); const controller = new AbortController(); this.active.add(controller); try { const signed = await this.api.partUrl(record.uploadId, partNumber); const response = await fetch(signed.url, { method: "PUT", body, signal: controller.signal }); if (!response.ok) throw new Error(`part_upload_failed:${partNumber}`); const etag = response.headers.get("etag"); if (!etag) throw new Error(`missing_etag:${partNumber}`); await this.api.commitPart(record.uploadId, partNumber, etag, body.size); completed[partNumber] = { etag, sizeBytes: body.size }; await save({ ...record, completed }); uploaded += body.size; onProgress(uploaded, this.file.size); } catch (error) { if (!this.paused && !this.cancelled) pending.push(partNumber); else if (!this.paused) throw error; } finally { this.active.delete(controller); } } };
    await Promise.all(Array.from({ length: this.concurrency }, worker)); if (this.cancelled) { await this.api.abort(record.uploadId); return { status: "aborted" as const }; } const parts = Object.entries(completed).map(([partNumber, part]) => ({ partNumber: Number(partNumber), etag: part.etag })); await this.api.complete(record.uploadId, parts); return { status: "completed" as const, fileId: record.fileId };
  }
}
