# Descent Evidence Log

A personal training tool built to support a structured fear-of-descending program with a mental performance coach. The app implements three core protocols from the program — evidence review, descent logging, and post-descent reset — backed by a Supabase database and hosted on Vercel.

---

## Background

After two crashes, descending on my tri bike stopped feeling natural. The nervous system did exactly what it was designed to do: it recorded both events, filed them under *descent = danger*, and began firing that threat response practically every descent - regardless of conditions.

This app was built alongside a four-session mental performance coaching program focused on systematic desensitization: the neuroscience-backed process of graduating exposure to feared stimuli in a controlled, tolerable way so the brain accumulates new evidence and updates its threat assessment.

The core insight: two crashes can outweigh hundreds of clean descents in the brain's threat calculations — not because the fear is irrational, but because high-arousal experiences are encoded with greater depth and retrieved with greater ease than neutral ones. The evidence log directly attacks that asymmetry.

---

## What it does

### Pre-Ride Protocol
Before every ride, the app surfaces your full evidence log formatted for reading aloud. Reading aloud activates the auditory cortex and language processing regions simultaneously, producing stronger neural encoding than silent reading — feeding counter-evidence into the nervous system before the amygdala has a chance to prime the threat response.

A four-step checklist walks through:
1. Reading every log entry aloud
2. Stating a one-sentence summary aloud ("Every descent I completed produced nothing")
3. Noticing where that lands in the body — the *felt sense* to carry to the bike
4. Running the pre-descent body scan (is your jaw tight → are your hands clenched → are you holding your breath → where is your eyeline)

### Descent Logging
Each entry captures three fields, logged within 30 minutes of finishing the ride:

- **What you did** — gradient, surface, familiarity, distance
- **What your body did** — what threat signals fired, where, and how they changed
- **What the descent actually produced** — not what you feared, what actually happened

Plus anchor points (anchor points roughly 30 meters apart — pass one, acknowledge it, move to the next. Keeps the descent broken into manageable targets rather than one overwhelming stretch.) used, where attention was focused, a summary sentence, and whether the post-descent reset was completed.

Over time, the volume of entries is the point. The brain is a prediction machine — the log is how you change what it predicts.

### Post-Descent Reset
A two-minute, three-step protocol run immediately at the bottom of every descent:

1. **Stop** — stand still for 20 seconds, let the body register that movement ended and nothing went wrong
2. **Breathe** — three breaths, in for 4, out for 6 (vagus nerve activation, parasympathetic tone)
3. **Say it** — *"I did that."* A statement of fact that closes the threat cycle cleanly

Research on exposure-based interventions consistently shows that the quality of the post-exposure window determines a significant part of how the experience is encoded. This reset gives the nervous system a reliable, repeatable method for filing the experience correctly every time.

---

## Tech stack

- **React** + **Vite**
- **Supabase** (Postgres) for persistent storage
- **Vercel** for hosting
- Password-protected entry creation via env var

---

## Setup

### 1. Install dependencies
```bash
npm install
npm install @supabase/supabase-js
```

### 2. Create the Supabase table
In the Supabase SQL editor:
```sql
create table descents (
  id bigint primary key,
  date text,
  difficulty text,
  what_did text,
  what_body text,
  what_produced text,
  anchor_count text,
  attention_on text,
  reset_done boolean,
  summary_sentence text,
  created_at timestamptz default now()
);
```

### 3. Configure environment variables
Create a `.env.local` file in the project root:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_PASSWORD=your_chosen_password
```

Make sure `.env.local` is in your `.gitignore`.

### 4. Run locally
```bash
npm run dev
```

### 5. Deploy
Push to GitHub, import to [Vercel](https://vercel.com), add the three environment variables under Project Settings → Environment Variables, and deploy.

---

## License

MIT