# Interview Prep Brief: Joe Alexander, "Head of Offshore Development Technology," SSY — Full-Stack Developer (First-Stage)

## TL;DR
- **Joe Alexander himself cannot be confirmed from any public source.** Despite extensive searching (LinkedIn, SSY's own staff directories, trade press, Companies House, GitHub), there is no public evidence of a "Joe/Joseph Alexander" at SSY, nor of the exact title "Head of Offshore Development Technology" anywhere on the public web. Treat his bio as unknown and prepare around the role and SSY's offshore-tech context instead.
- **The context is very well documented and very favorable to your profile.** SSY built an offshore desk from scratch via acquisitions (Westshore 2023, F3 Offshore 2023, Grieg 2026), hired a high-profile CIO (Richard White — ex-Clarksons and a co-founder of the Sea/ platform) in June 2025, and is in active digital-transformation mode. They are explicitly building bespoke data products and web platforms for brokers — exactly the work a full-stack hire would own.
- **Your AI-first, ship-fast, solo-shipped profile is a strong fit, but the single biggest risk is "never worked on a team."** Prepare hard for code-review, shared-codebase, and collaboration questions, and reframe your solo discipline (CLAUDE.md constitutions, ~1,500 tests, sub-agent orchestration) as evidence you already practice the rigor teams need.

## Key Findings

**1. On Joe Alexander (the person): UNCONFIRMED.**
No public profile, press mention, conference talk, article, or company-directory entry connects any "Joe Alexander" or "Joseph Alexander" to SSY, Westshore Shipbrokers, or F3 Offshore. The exact title "Head of Offshore Development Technology" returns zero public results in any maritime or shipbroking context. This means one of three things: (a) it's a recently created internal role not yet public; (b) the title is slightly paraphrased/misremembered; or (c) he keeps a deliberately low online profile (common for engineers). Any of these is normal and not a red flag — but you should walk in assuming you know nothing verified about him personally, and confirm his background by asking him directly.

**2. On SSY's offshore technology context: CONFIRMED and rich.** This is where you should anchor your preparation.

**3. On the role's likely scope and the interview themes: INFERRED** (clearly flagged below), based on the title, SSY's structure, and the published job stack.

## Details

### What we know about SSY's offshore business (confirmed)
- **SSY = Simpson Spence Young**, the world's largest independent (privately owned) shipbroker, founded in **1880** (the "145-year-old shipbroker"), headquartered in London. It rebranded from "Simpson Spence & Young" to "SSY" in October 2023. Managing Partner is **Stanko Jekov**, who joined SSY in 2002, was made partner eight years later, and **started in the top job on 1 January 2023** (succeeding chairman Mark Richardson). Per Lloyd's List, the firm "expanded from 370 people to around 550" under Jekov; Lloyd's List's "Top 10 shipbrokers 2025" gives the latest breakdown as "410 shipbrokers, up from 340 in 2024, and a further 200 personnel in 27 offices worldwide" (≈610 staff total).
- **Jekov's stated ambition** (to Lloyd's List): to "expand by an additional 300 people in five years, taking the global company to more than 800," adding, "When we go into a market, we want to do it properly, and with most markets we enter, we want to be a top three player."
- **SSY entered offshore via acquisition:** "SSY marked its entry into the offshore sector in February 2023 with the acquisition of Westshore Shipbrokers in Norway. This was followed by the addition of German specialist shipbroker F3 Offshore in July of the same year." Westshore (Kristiansand; founded 1987) was acquired from Gøran Røstad (reportedly for a sum in the high-single-digit millions of US dollars); F3 Offshore (Hamburg; founded 2009) was "the first brokerage to specialise in North Sea renewables." SSY then agreed to acquire **Grieg Shipbrokers** (Oslo/Bergen/London; founded 1884), effective January 2026, and launched a dedicated offshore **Rig** business under Nicholas Wagner-Larsen, plus entered Uranium/nuclear-fuel broking and ship recycling.
- **Offshore covers oil & gas and offshore wind support vessels** — PSVs (platform supply vessels), AHTS (anchor-handling tug supply), CSV/MPSV (construction/multi-purpose support vessels), subsea/IRM, plus drilling rigs and newbuilding. Offshore offices: Aberdeen, Dubai, Hamburg, Kristiansand, Oslo, Bergen.
- **Named offshore leadership:** Frank Holck (Partner & Head of Offshore, Dubai); Gøran Røstad (former Westshore MD, now senior in Norway offshore); Erik Greve-Isdahl (Director, Offshore & Aquaculture, Bergen). The offshore team is brokers and analysts — no publicly listed technology titles.

### SSY's digital/technology direction (confirmed)
- **CIO Richard White joined 2 June 2025** in a newly created role. Per SSY's own press release, he was "one of the founders of Sea/ by Maritech" (Clarksons' chartering platform) and had a "16 year tenure at Clarksons" overhauling its digital infrastructure and data services; he later worked at GTMaritime and Onyx Capital Group. Jekov framed the hire around real-time data: "Digitalisation is rewriting how brokers operate on a day to day basis. Clients now require and indeed, expect data in real time wherever they may be." White's stated aim, verbatim: "My aim is to leverage on all of my past experience in order to provide best-in-class solutions for the brokers and analysts within SSY."
- **SSY co-launched "Ocean Recap"** with Arrow, Gibson, Howe Robinson and IFCHOR Galbraiths — a recap and charter-party management platform built "in partnership with Signal Ocean" (for independence/neutrality) over "18 months." Per the launch communications, it "has already produced more than 1,000 charter parties for more than 75 clients across both the tanker and dry markets." Ocean Recap CEO Jeroen Wolthuis called it "a defining moment for the maritime industry," and Splash247 notes it targets "the Clarksons-backed SEA platform which has come to dominate this field."
- **SSY has a minority stake in Signal Ocean**, a data-led shipping-technology platform, and a longstanding technology partnership with it.
- **SSY's in-house technology stack (from its own careers page):** the core enterprise stack is **.NET / Blazor (C#), SQL Server, and Microsoft Azure**. Recent openings include a "Junior Developer (C#/Blazor)" and roles building "dynamic dashboards, reports and data portals that support our broker and research desks" and "SSY's bespoke data products… ensuring data integrity" across its global offices. Note this is the *main* enterprise stack — different from the React/TypeScript/Node/PostgreSQL stack in your offshore job description, which suggests the offshore product is a newer, more modern, possibly standalone build (consistent with inheriting Westshore's app estate).
- **Offshore digital assets:** the offshore desk operates client-facing apps and sites — ssyoffshore.com and westshore.no (now SSY-branded) surface Fixtures, Requirements, Positions, News and market intelligence; there is a legacy "Westshore Shipbrokers" iOS/macOS app; and an offshore web app appears to be hosted on Azure (a vimsa.azurewebsites.net instance). SSY also references a "Navigator" client login.

### What "Head of Offshore Development Technology" likely owns (careful inference — NOT confirmed)
Given the title and SSY's structure, this role most plausibly owns:
- **The offshore broking platform/data products** — the vessel, fixture, requirement, position and recap tooling used by offshore brokers and shown to clients (the modern React/TypeScript/Node/PostgreSQL stack in your JD, distinct from SSY's central .NET estate).
- **A small offshore-focused developer team or sub-team**, sitting under or alongside CIO Richard White's broader technology organisation, but with domain proximity to the offshore desk (likely Norway/London).
- **Data pipelines and data accuracy** — ingesting and modelling vessel data, fixtures/recaps, positions, and market intelligence; integrating with central SSY data and possibly third parties (e.g., Signal Ocean, AIS providers).
- **Modernisation/consolidation** — migrating or rebuilding the inherited Westshore/F3 offshore app estate into a coherent, maintainable platform aligned to the firm's digital-transformation push.
This is inference; verify it with him directly (see questions below).

### Technical/product priorities this person likely cares about (inference, grounded in the JD)
The JD's stack — React, TypeScript, Node.js, PostgreSQL, REST APIs; nice-to-haves Python, Docker, cloud, CI/CD, testing, Next.js — plus a strong "AI-First Thinking" emphasis (they use Claude and Cursor) points to a leader who will prize:
- **Shipping speed with verification** — using AI assistants (Claude Code, Cursor) to move fast, but with human review, tests, and guardrails so AI output is trusted, not blindly merged. This is the central tension of AI-first teams in 2026 and almost certainly his top theme.
- **Domain modelling accuracy** — offshore broking has precise, high-stakes entities (vessel specs, day rates, charter terms, positions, recaps). Bad data erodes broker trust instantly. Expect heavy emphasis on correctness and data integrity (echoing the SSY careers language about "data integrity" and "precision as much as pace").
- **Code quality and maintainability** — because the platform must be handed across a growing team and integrated with central SSY systems.
- **Pragmatic full-stack ownership** — end-to-end feature delivery, REST API design, sensible Postgres schema design, and clean React/TypeScript components.

## Likely interview questions (first-stage, hiring-manager/head-of-tech — not HR)
**Technical fundamentals**
- Walk me through how you'd design the data model and REST API for [vessels / fixtures / positions / recaps].
- How do you structure a React + TypeScript app for maintainability? State management choices and why.
- Node.js: how do you structure services, handle errors, validate inputs, and design endpoints?
- PostgreSQL: schema design, indexing, query optimisation, migrations.
- How do you handle data accuracy/integrity when ingesting messy external data?

**AI-first working**
- You use Claude Code/Cursor daily — show me your workflow. How do you stop AI from shipping subtly wrong code? How do you verify output?
- Where does AI help most, and where do you deliberately not trust it?

**Ways of working / collaboration (your key risk area)**
- Tell me about working on a shared codebase with other engineers. How do you handle code review — giving and receiving?
- How do you keep your work mergeable and avoid stepping on teammates?
- How do you handle disagreement on technical approach?

**Delivery & judgement**
- Tell me about a production system you shipped end-to-end. What broke, and what did you do?
- How do you decide what to test vs. ship quickly?
- How do you scope and prioritise when requirements are vague (translating broker requests into software)?

**Motivation / domain**
- Why shipbroking/offshore? What do you know about what we do?
- Why join a team now after working solo?

## Best answers for your profile
- **Lead with verified, shipped outcomes:** "6 production systems shipped solo, ~1,500 automated tests." This directly answers delivery and quality, and pre-empts the "can AI-first devs actually ship reliable software?" worry.
- **Turn AI-first into a rigour story, not a shortcut story.** Explain your CLAUDE.md constitution files and sub-agent orchestration as a *methodology for control and verification* — you encode standards, constraints, and review gates so AI accelerates without degrading quality. This is exactly what a head of technology rolling out Claude/Cursor across a team wants to hear, because their biggest fear is unreviewed AI slop.
- **Pre-empt the "never on a team" risk head-on (see Risks).** Don't hide it; frame it.
- **Show domain curiosity:** reference what you know — that SSY built offshore via Westshore/F3/Grieg, that offshore covers PSV/AHTS/CSV and rigs across oil & gas and offshore wind, that data accuracy is sacred for brokers, and that the firm is in active digital transformation under a new CIO (Richard White, who came from co-founding Clarksons' Sea/ platform). This signals you did real homework.
- **Map your FastAPI/Python experience** to their Python nice-to-have and data-pipeline needs; map your Next.js to their Next.js nice-to-have.

## Questions to ask him
*Role & scope*
- How is the offshore technology team structured today, and how does it relate to Richard White's central technology organisation?
- Is the offshore platform a greenfield/modern build, or are you consolidating the inherited Westshore/F3 systems? Where is it on that journey?
- What does success look like for this role in 6–12 months?

*Tech & product*
- The JD stack is React/TypeScript/Node/PostgreSQL, but SSY's core is .NET/Blazor/Azure — how independent is the offshore platform, and how do they integrate?
- How are you using Claude and Cursor across the team today, and what guardrails (review, tests, CI) do you put around AI-generated code?
- Who are the primary users — brokers, analysts, or external clients — and what's the most painful workflow you want to fix first?
- How do you currently handle data accuracy and source-of-truth for vessel/fixture/position data? (And does the platform tie into Signal Ocean or Ocean Recap at all?)

*Team & ways of working*
- What does your code-review and release process look like? How big is the team and how do you split work?
- How do you balance shipping speed with the data-correctness demands of broking?

*Strategy*
- With Grieg joining in 2026 and the offshore desk still expanding, how do you see the platform's roadmap evolving?

## 30-minute interview strategy
- **Minutes 0–5 — Frame and rapport.** Briefly position yourself: full-stack (4 yrs React/TS/Next/Node, 2 yrs Python/FastAPI), 6 production systems shipped solo with ~1,500 tests, daily AI-first practitioner with a structured methodology. Signal you've researched SSY's offshore story. Ask early (lightly) what he owns, so you can tailor the rest.
- **Minutes 5–18 — Technical + AI-first depth.** Let him drive, but steer toward your strengths: domain modelling, REST/Postgres design, and especially your *verified* AI workflow. Whenever you mention AI speed, immediately pair it with how you verify (tests, review, constitution files). This is your differentiator and likely his top concern.
- **Minutes 18–25 — Address the team risk proactively.** If he hasn't asked, raise it yourself: "One thing I want to be upfront about — I've shipped a lot solo, and joining a team is the deliberate next step for me. Here's how I've already built team-style discipline into my solo work, and here's how I'd approach code review and a shared codebase." Owning it converts your biggest weakness into evidence of self-awareness.
- **Minutes 25–30 — Your questions + close.** Ask 2–3 sharp questions from the list (scope, AI guardrails, roadmap). Close by confirming interest and asking about next steps and timeline. Mention your visa status proactively only if asked or if it naturally fits ("based in London, spouse visa valid to 2029, no sponsorship needed") — it's a positive for them and removes a hiring-friction worry.

## Recommendations
1. **Prepare around the role and SSY context, not the man.** Since Joe Alexander is unverified publicly, do not pretend to know his background — instead, demonstrate deep knowledge of SSY's offshore/digital strategy and ask him about his team. Benchmark to change this: if you can find his LinkedIn before the interview (try searching his name with "SSY" or "Westshore" while logged into LinkedIn), tailor further; if not, proceed with the context-first approach.
2. **Rehearse the AI-verification narrative until it's crisp.** This is the highest-leverage 90 seconds of your interview. Have one concrete example of AI nearly shipping something wrong and how your process caught it.
3. **Script your "first time on a team" answer.** Practice it out loud. The goal is to sound like someone who has independently developed team-grade habits and is hungry for collaboration — not someone who's never been reviewed.
4. **Brush up on offshore domain basics** (PSV/AHTS/CSV/MPSV, day rates, charter/recap basics, oil & gas vs offshore wind) so you can talk about the data you'd be modelling with credibility.
5. **If it goes well, expect a technical second stage** — likely a deeper system-design or live coding/pairing exercise. Ask about format at the close so you can prepare.

## Caveats
- **Joe Alexander's identity, title, background, and tenure are entirely unconfirmed.** The title "Head of Offshore Development Technology" appears nowhere publicly; treat it as provided by you/the recruiter, not verified. If his actual title or remit differs, recalibrate.
- **Role scope is inferred** from the title, SSY's structure, the job's tech stack, and the firm's digital direction — not from any SSY description of this specific job. Confirm with him.
- **Stack mismatch flag:** SSY's *public* job ads and careers page describe a .NET/Blazor/SQL Server/Azure house, while your JD is React/TypeScript/Node/PostgreSQL. The most likely explanation is that the offshore platform is a separate, more modern build (plausibly inherited and modernised from Westshore/F3). Worth confirming, because it affects how the offshore team relates to the rest of SSY tech.
- All company facts here are from trade press (TradeWinds, Splash247, Lloyd's List, Riviera, Seatrade), SSY's own site/press releases, and org aggregators; figures like headcount and dates are as reported and may have moved (note the modest discrepancies between sources on exact staff counts, ~550 vs ~610).