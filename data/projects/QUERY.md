# Projects source and refresh

The recovered registry contains 635 Wikidata entities (CC0); the dashboard joins
four separately curated profiles by explicit Wikidata ID where available. Noor and
The Line are absent from that recovered registry, giving 637 displayed records.
Country, type and stage filters use source fields, not guesses from project names.
The recovered type/stage values remain inherited, rather than newly verified claims.

`projects-data.yml` is manual, has no secrets and publishes a versioned **Actions
artifact only**. It refreshes those explicit entity IDs in batches of 40 using
`tools/projects_data.py::query_for`: P625 coordinates, P17 country, P571 inception,
P576 dissolution, English labels and English Wikipedia links. A P576 record is
excluded. Missing entities, malformed coordinates and conflicting coordinate
claims fail validation. Raw responses stay in `raw/`; only a completely successful
refresh writes `validated/projects.json`. Failed runs cannot replace checked-in data.
No article pages, copyrighted databases or financial jobs are downloaded.

Review source stage claims, cancellation/decommissioning and duplicate entities
before accepting an artifact. P576 alone does not identify every cancelled project.
The workflow deliberately does not infer a current stage or add images automatically.

## Curated profiles: partial

`assets/globe/projects-featured.json` is shared by the Globe and standalone page.
It preserves Claude's four photos, source links and original date precision. Its
photo SHA-256 values identify the credited local files. Milestones are individually
linked; no sample costs, population, length or target dates are present.

The requested 30–50 profiles with 2–5 milestones each are **not yet complete**.
The environment blocks Wikipedia, Wikimedia Commons and Wikidata, so new source
checks could not be performed here. Four inherited profiles are included; Noor and
The Line currently have only one dated milestone. Do not describe this as a completed
30–50 project curation. New profiles require dated evidence plus an image-specific
commercial licence (CC0/public domain/CC BY/CC BY-SA), author and Commons file URL.
Reject NC/ND or unclear rights. Do not treat a website footer as an image licence.

Estimated manual refresh: 16 source requests, 2–8 Actions minutes, zero Gemini calls.
No daily minutes, schedules, new secrets, deployment or KV publication are added.
