# Module: Vault

## Data
Table: `vaultItems`, referencing `fileBlobs`.

## Features
Notes, documents, certificates, bookmarks, ideas, receipts, links, files
— a general-purpose personal archive, organized by `type` and free-form
`tags`, with search across title/content/tags.

## Behavior rules
- Vault is intentionally schema-light (a single `vaultItems` table with a
  `type` discriminator) rather than 8 separate tables, because these
  entities share almost all behavior (title, tags, search, attach a
  file) and differ only in icon/default view — avoid over-normalizing.

## Failure risks specific to this module
- Full-text search across potentially large note/document content should
  be debounced and should not block the main thread on large vaults —
  consider chunked/indexed search only if profiling shows it's needed;
  do not prematurely add a search-index library.
