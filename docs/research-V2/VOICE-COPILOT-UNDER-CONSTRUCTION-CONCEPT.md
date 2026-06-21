# Voice Copilot Under-Construction Concept

## Core Idea

FixtureLog can expose an under-construction assistant that explains what the product is becoming,
what the current website can do, and what it is still learning from brokers and charterers.

This assistant is not a trained model and not a free-form chatbot. It is a controlled answer layer:

```text
current product facts
  + Stage research outputs
  + curated knowledge/corpus
  + deterministic app state/tools
  -> copilot answer layer
  -> voice assistant speaks the approved answer
```

## Product Framing

The assistant can say, in product language:

> "FixtureLog is under active build. I am a junior broker/charterer assistant being trained by the
> best brokers and charterers. I can explain what this workspace already does, what is being built
> next, and how the system will help with enquiries, shortlists, fixtures, risk, recaps, and market
> decisions."

## What It Should Answer From

The assistant's answers should come from:

- current website/application capabilities;
- living docs such as README, roadmap, architecture notes, and PR docs;
- Stage 0 / 0.1 / Stage 1 research outputs;
- deterministic app data exposed through approved read tools;
- later, a curated RAG corpus for shipbroking/domain reference material.

## What It Should Not Do

The assistant must not:

- pretend unsupported features already exist;
- answer from vibes or generic shipping knowledge without a source;
- make legal/compliance decisions;
- mutate application state by voice;
- claim it has been "trained" as a model.

Preferred language:

- "I answer from the current product evidence."
- "I am being improved through curated knowledge and broker feedback."
- "I can explain what the app currently does and what is planned next."

Avoid:

- "I trained myself."
- "I know everything about shipbroking."
- "I can decide if a fixture is legally safe."

## Voice UI Concept

The landing/private-build page can show a living voice core:

- calm spheres when idle;
- attentive motion while listening;
- pulsing/rippling spheres while speaking;
- slower internal glow while thinking.

This is a visual metaphor for the assistant's current state, not proof of autonomy.

## Relationship To The Research Chain

The research chain determines what the assistant is allowed to say.

- Stage 0 says what FixtureLog already is.
- Stage 0.1 says what decisions are binding and what research is already settled.
- Stage 1 will say what sanctions/operator-risk knowledge should be added.

Only after those outputs exist should the assistant's answer script/corpus be updated.

## Open Naming Options

- Under-Construction Copilot
- Build Notice Voice Agent
- FixtureLog Training Assistant
- Broker/Charterer Junior Assistant
- Product Evidence Assistant

The strongest technical name is probably:

> Product Evidence Assistant

The strongest user-facing phrase is probably:

> "I'm still being trained by brokers and charterers."
