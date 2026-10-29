# Agent skills

How agents run the repo's skills. `AGENTS.md` points here; `/ask-learn-it-mcp` lists them and when to use each.

## Editing a skill

Edit the skill in `.claude/skills`, then run `node tools/skills-sync/sync-skills.mjs` to copy it to `.agents/skills`, the folder Codex reads. The check (`--check`) fails while the two differ.

The vendored Matt Pocock skills stay unmodified. Where one's text differs from this repo's docs (for example, it writes decisions to `docs/adr/`), the repo's docs win: decisions live in `docs/architecture/decisions.md`.

## Manual-only skills

Skills whose `SKILL.md` sets `disable-model-invocation: true` (such as `/grill-with-docs`, `/to-spec`, `/to-tickets`, `/implement`, and `/retro`) start only when the owner types them. When a flow reaches one, give the owner the exact command to type.

## The feature flow, command by command

The owner types each manual command, in this order; a plan or pasted message that names one does not start it. `/pr` is the one step the agent may run itself.

1. `/to-spec`: publishes the spec as a GitHub issue. The owner reviews the issue before going on.
2. `/to-tickets #<spec>`: publishes the tickets as sub-issues of the spec, with native blocking links.
3. `/implement #<ticket>`: once per ticket, in blocking order. It runs `/tdd` and `/code-review` itself, and commits to the branch.
4. `/pr` shapes the PR body. The agent may run it when asked to open the PR; nothing merges without the owner.
5. `/retro`: after the PR, to turn the session's mistakes into checks and rules.
