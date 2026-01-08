---
description: How to lock and unlock files for exclusive editing
---

# File Locking Protocol

Prevents multiple agents from overwriting each other's work.

## Before Editing Any File

1. Read `.agent/locks/active_locks.json`
2. Check if your target file has an active lock
3. **If locked by another agent**: STOP and wait or coordinate
4. **If unlocked**: Add your lock entry

## Lock Entry Format

```json
{
  "path": "src/ui/Components.js",
  "agent": "ui_artist",
  "timestamp": "2026-01-02T12:59:11-06:00",
  "purpose": "Adding navigation component"
}
```

## Acquiring a Lock

// turbo
1. Read `active_locks.json`
2. Append your lock to the `locks` array
3. Write back to `active_locks.json`
4. Proceed with edits

## Releasing a Lock

// turbo
1. Read `active_locks.json`
2. Remove your lock entry (match by path + agent)
3. Write back to `active_locks.json`

## Rules

- **One lock per file** - No concurrent edits to the same file
- **Release promptly** - Don't hold locks longer than needed
- **Include purpose** - Help others understand what you're doing
- **Check before every edit** - Even for "quick" changes
