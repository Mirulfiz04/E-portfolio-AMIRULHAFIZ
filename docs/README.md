# Project documentation

Start here. Each page says what it covers and who owns it, so that someone new can find the reason behind a choice without asking.

| Page | What it answers |
|---|---|
| [../README.md](../README.md) | What the site is, how to edit content, how to run it |
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | How a change goes from issue to live site |
| [../CHANGELOG.md](../CHANGELOG.md) | Dated timeline and the issue/pull request ledger |
| [architecture.md](architecture.md) | How the site, the pipeline and the outside services fit together |
| [decisions/](decisions/) | Why things are the way they are (one short record each) |
| [known-issues.md](known-issues.md) | Confirmed bugs and gaps that are not fixed yet |
| [team-log.md](team-log.md) | Who was assigned what in each round of work, and its honest status |

Owned elsewhere (not copied here):

- `docs/design/`: the motion specification (Designer). Not in the repository as of `e322405`.
- `docs/qa/`: cross-device test records (QA). Not in the repository as of `e322405`.
- `backend/README.md`: the local AWS backend (Backend). Not in the repository as of `e322405`.

## Rules for these pages

- Record what is proven by a commit, a run or an issue. Anything else is "assigned" or "planned".
- Never put private data in the repository: no email addresses, student numbers, local file paths or session links.
- When something changes, update the page in the same pull request and add a line to the changelog.
