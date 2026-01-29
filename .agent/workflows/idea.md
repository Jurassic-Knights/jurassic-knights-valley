---
description: Log a new idea to the ideas document for future reference
---

# /idea Workflow

When the user runs `/idea`, follow these steps:

## 1. Receive the Idea

Listen to the user's idea. It can be:
- A fully fleshed-out concept
- A rough sketch or fragment
- Just a single sentence or keyword

## 2. Clarify if Needed

Always ask 5 clarifying questions such as:
- **What problem does this solve?** (gameplay, UX, content gap)
- **What's the core mechanic or feature?**
- **Which game system does this relate to?** (combat, inventory, progression, UI, etc.)
- **Any visual or thematic notes?**
- **Priority level?** (nice-to-have, important, critical)

Do NOT add to the document until you have enough detail to make the entry useful.

## 3. Propose Suggestions

After understanding the idea, propose enhancements or variations:
- **Extensions:** Ways to expand the core concept
- **Synergies:** How it could interact with existing systems
- **Alternatives:** Different approaches to achieve the same goal
- **Edge cases:** Potential issues or considerations to address

Present these as brief suggestions for the user to consider. They can accept, reject, or modify any of them before we document. Present 5.

## 4. Document the Idea

Once clarified and suggestions are discussed, add the idea to `docs/ideas.md` under the **Ideas Backlog** section using this format:

```markdown
### [Idea Title] - [Date]
**Category:** [Combat / UI / Progression / Content / Audio / Visual / Other]
**Priority:** [Low / Medium / High / Critical]
**Status:** 💡 New

**Summary:**
[1-3 sentence description of the idea]

**Details:**
[Bullet points with specifics, mechanics, or notes]

**Related Systems:**
[List any systems this would interact with]

---
```

## 5. Confirm with User

After adding the idea, confirm it was logged and summarize what was added.

## Notes

- Keep entries concise but complete enough to understand months later
- If an idea relates to an existing one, note the connection
- When ideas get implemented, move them to **Archived Ideas** with implementation date