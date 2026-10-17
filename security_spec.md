# Security Specification: TmpDrop Temporary File Service

## 1. Data Invariants
1. File records must have valid IDs conforming to `^[a-zA-Z0-9_-]+$` with length between 4 and 64 characters.
2. File metadata requires valid `originalName`, `size` (> 0), `mimeType`, `uploadTimestamp`, `expiresAt`, `expirationPlan`, and `deleteToken`.
3. In this guest-access architecture (no user login required), file metadata can be read publicly via direct document lookup (`/files/{fileId}`), but sensitive fields like `deleteToken` and `passwordHash` must never be modifiable by unauthenticated updates.
4. Client SDKs cannot overwrite immutable fields: `id`, `originalName`, `size`, `uploadTimestamp`, `expiresAt`, `expirationPlan`, and `deleteToken` cannot be modified once written.
5. Deletion of a file document from the client is authorized if and only if the request supplies the matching `deleteToken` in the deletion action payload, or through the server-side API which validates the token.
6. Downloads increment `downloadCount`. Once `downloadCount >= maxDownloads` (when maxDownloads > 0), access is blocked or marked expired.

## 2. The "Dirty Dozen" Payloads (Denial Scenarios)
1. Injecting arbitrary admin attributes (`isAdmin: true`) on file creation.
2. Forging an invalid expiration plan (`expirationPlan: "infinite_9999y"`).
3. Attempting to upload file metadata with negative size (`size: -1024`).
4. Attempting to list all files without filters (scrapes entire database).
5. Attempting to delete a file without providing the correct `deleteToken`.
6. Attempting to update immutable fields like `originalName` or `expiresAt` after creation.
7. Attempting to overwrite someone else's file document with a malicious target link.
8. Injecting a 1MB payload string in `originalName` (exceeding 255 chars).
9. Modifying `downloadCount` downwards (attempting to reset download limits).
10. Setting an invalid ID with special characters (`/files/../hack/etc`).
11. Attempting to forge batch metadata with negative `totalFiles`.
12. Attempting to bypass password checks by reading raw `passwordHash`.
