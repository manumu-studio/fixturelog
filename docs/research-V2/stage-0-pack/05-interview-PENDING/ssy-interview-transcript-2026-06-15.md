# SSY First-Stage Interview — Conversation with Joe

> **Provenance:** Cleaned reconstruction, NOT a verbatim transcript. Original audio was unlabelled
> voice-to-text with overlapping speakers/phone calls; speaker attribution and wording inferred and
> tidied for readability. Treat as a faithful summary of the exchange, not an exact record.
> **Interview date:** 2026-06-15 (Mon, 13:30, MS Teams — per recruiter email).
> **Participants:** Joe Alexander (Head Developer, greenfield team, SSY) · Manu Murillo (candidate).
> **Confidence for Stage 0:** CONFIRMED (candidate recollection) — high-confidence recall, not audio.

---

## Opening
**Joe:** Nice to meet you. No apologies needed about yesterday — I was very busy, and I'm pretty stacked today, so 10:30 is my limit. But it's great to meet you. Looks like you've got a nice place — much tidier than mine.
**Manu:** Thank you. I've been working on it. Because I spend most of my time working from home, mentally it's much better to have a really nice place where you feel comfortable.
**Joe:** I totally agree.
**Manu:** Actually, there's something I removed — a big whiteboard where I write all my ideas and notes. Old school, because that's what I learned, instead of using the computer for notes.
**Joe:** Absolutely. Writing things down helps you commit them to memory a bit more.
**Manu:** Yeah, and you don't lose the skill of writing.
**Joe:** No, absolutely.

## Joe introduces SSY
**Joe:** So, just to tell you a little bit about SSY. I'm Joe, one of the head developers here. We've got two developer teams. Mine is the forward-thinking, greenfield stuff; the other team handles the legacy systems.

SSY is around 145–146 years old. We're a ship brokerage — the world's largest *independent* ship brokerage. We get beaten by the public players like Clarksons, but they have institutional money. We're self-funded, with 600+ people across 20+ offices worldwide.

We're only just getting into proper big development. When I joined this side there were three developers. We're now about eight, and looking to build up a lot more over the next couple of years. I've been here nearly three years — I joined as a full-stack developer, and I'm fair proof there's a lot of room for growth. It was my second proper job, and I've now got quite a big seat at the table in terms of what we work on.

So — tell me a little about yourself.

## Manu's background
**Manu:** My name is Manu. I'm from Colombia, moved to Argentina very young — that's where I got the fundamentals of engineering: maths, physics, the start of industrial engineering. I've lived in several places, so I adapt very fast to any environment. Studied economics/macroeconomics with time in Chile, then moved to Spain — an internship in Gran Canaria on renewable energy. Planned to keep studying in Spain, then met my partner (he's Israeli) and moved to Israel. Israel is a high-tech country with very high standards; while waiting a year for residency he suggested I study development. That's when I switched fields.

It was 1,200 hours of intense full-stack learning — programming basics, then front end, back end, databases. That's when I understood how those three pillars join. Worked at a startup a couple of months, then moved to London.

I've built almost six applications end to end. A client told me to develop everything — he'd give instructions, I'd find the right design and UI; all about visuals and animations. That's when I understood React properly, because the images were heavy to load. I ask my senior-dev friends what's new constantly — that's how I got into Next.js (combines back end and front end, Node under the hood), my favourite framework. Then I needed Python, knowing Next.js's limits. I started with AWS deployment and CI/CD.

I started using Cursor about two or three years ago. It made so many mistakes at first that I had to develop my own methodology and rules for working with it. Then Claude launched — I used it from day one, a big improvement. More recently I added Codex. I work with all three in parallel, each with its own job. When I read the job spec, I saw a really strong match — it's exactly what I've been doing for years.

## Joe on fit, SSY's stack, and AI philosophy
**Joe:** Your background fits — the economics side feeds in very well; the economy is roughly what we do, with price matches and the data we work with.

My team works with newer frameworks. We use pretty much whatever works — some Angular and React with Express back ends, a couple of Next.js apps, a few different Python workflows. We now use Claude across the board, and Codex as well. So it's very much what we're looking for.

We want people who aren't afraid to make mistakes but who learn from them — that's a big thing for me. And people who'll push the boat out: a new AI comes out, within reason, test it, why not? We're not afraid of spending money to innovate, because the money we spend now saves money going forward. I see it as an investment.

**Manu:** I see it the same way. Every mistake, I don't see as a mistake — I see it as a lesson. So instead of just listing what I've done, I researched what your company does and the domain — which is difficult and most people don't understand. It took me a while to understand the dynamic between charterer, broker, and owner — how you get the enquiry, then the fixture at the end of the pipeline, and the hardest parts for a broker. So I built an end-to-end demo. It's already launched — a tool that helps brokers make decisions faster about matches and which vessel is right for the client.

**Joe:** Absolutely, you should have something like that. And especially, with wars and sanctions — that's one of the big issues. We may have dealt with an operator before, but next thing you know they're on a sanctions list, and we can't operate with them. That's key decision-making we do as a brokerage every day.

## Demo walkthrough
**Manu:** Let me share my screen — I'll send the repo link and the app link, on my own domain, deployed on Vercel this time (no heavy data processing or ML here).
This is the broker page: list of enquiries, shortlisted ones, requirements. I integrated a chatbot to help the broker. I used seeded data for the vessels, but I've got the regional map API, and Open-Meteo for live weather.
When an enquiry comes from a charterer and the broker opens the app, I created an endpoint and a formula that ranks the best matches. I'm not replacing the broker — just reducing the time it takes. This is the client portal, where the charterer creates the enquiry. Then it goes into PostgreSQL.
**Joe:** Is that the one I saw in your docs?
**Manu:** Yes. Fifteen tables, lots of dependency between them. The match uses weights — how much each factor counts. First, distance (how close the vessel is). Second, rate fit (how well the day rate fits the budget). Third, capability margin (how much extra capability). Those weights give the percentage that ranks each match — a sorted list to start the negotiation and close the deal.
**Joe:** Really cool. This is pretty much exactly what we build on the offshore side. I look forward to a proper look. Honestly, conscious of time — fundamentally, all the technical questions I was going to ask, I don't need to, because you've proven you can do it.

## The five-year question
**Joe:** The only question I have: where do you see yourself in five years?
**Manu:** At your company, professionally. The next step I need is to work with experts, enrich my knowledge, share my ideas and way of working, contribute, and get feedback. This is a big company with many years of experience, so I can learn a lot. And if I succeed, I see myself helping with more complex problems.
**Joe:** That's absolutely fine.

## Wrap-up
**Joe:** Manu, is it alright if I take this over email? There's another call happening, so I need to run. But this was great.
**Manu:** Of course.
**Joe:** Cheers — speak soon.

*End of reconstructed transcript.*
