# StreamHealth Live

> **Interactive public-health epidemic outbreak response game for Twitch livestreams.**  
> Viewers vote in chat as a district health incident command team, directly bending a live epidemic curve across sequential outbreak scenarios.

---

## 🌟 Key Features

1. **Native Twitch Chat Voting (`!1`, `!2`, `!3`)**
   - Connects anonymously to Twitch chat (`wss://irc-ws.chat.twitch.tv:443`). No OAuth or moderator privileges needed.
   - Channel can be set in the UI or via `TWITCH_CHANNEL` environment variable.
   - Dual connection resilience: Browser-native IRC WebSocket + Node/Express backend WebSocket fallback.

2. **Strict Anti-Spam & Fair Voting**
   - **One vote per user**: The last vote submitted replaces any prior choice.
   - **Rate limiting**: Rejects rapid spam from the same user within 400ms.
   - **Length restriction**: Messages longer than 12 characters are ignored.
   - **Accepted commands**: `1`, `2`, `3`, `!1`, `!2`, `!3`, `!vote 1`, `!vote 2`, `!vote 3`, `!a`, `!b`, `!c`.

3. **Continuous Multi-Scenario Epidemic Curve**
   - HTML5 Canvas Line Chart plotting cases across 30 days (10 days per scenario).
   - Dynamically bends according to the winning audience choice (+surge or -suppression).
   - Tracks **Active Cases**, **Deaths Averted**, and **Community Trust (0–100%)**.
   - Preserves historical caseload carryover between sequential scenarios.

4. **Trilingual Localization**
   - Instant language switching:
     - 🇬🇧 **English (`en`)**
     - 🇪🇹 **Amharic (`am` / አማርኛ)**
     - 🇹🇿 **Swahili (`sw` / Kiswahili)**

5. **Gamification & Live Incident Leaderboard**
   - Points & streaks awarded at round close:
     - **+100 points** for voting with the optimal epidemiological choice.
     - **+25 points** for general round participation.
     - **Streak multiplier** up to 5x for consecutive optimal votes.
   - Live **Top 5 Responders** display with avatars and badges.

6. **Gemini AI Epidemiological Explain**
   - Uses `gemini-3.8-flash` via `@google/genai` to generate a 3-sentence, grade-6 explanation of why the choice helped or hurt.
   - Strict **4-second timeout** with seamless fallback to prewritten evidence-based explanations.

7. **Audio Synthesis (Web Audio API)**
   - Zero-asset audio synthesis using browser oscillators:
     - Countdown ticks and urgent alert pings (last 5s).
     - Decision lock gavel.
     - Celebratory arpeggio fanfare + canvas confetti on optimal choice.
     - Suboptimal warning tone.
   - Sound toggle state persisted in `localStorage`.

8. **Zero-Dead-Air Auto-Advance**
   - 10-second auto-advance timer after round closure, with Pause/Resume controls for the streamer.

---

## 🎥 OBS Studio Overlay Setup

StreamHealth Live includes a dedicated **Broadcast Overlay Mode** tailored for OBS Studio:

1. In OBS Studio, add a **Browser Source**.
2. Set the URL to:
   ```
   http://localhost:3000/?overlay=1
   ```
3. Set the dimensions:
   - **Width**: `1920`
   - **Height**: `1080`
4. The background will automatically render **100% transparent**, hiding all host buttons and displaying only:
   - Live Incident Command banner
   - Outbreak metrics (Active Cases, Deaths Averted, Trust)
   - Synchronized countdown clock
   - Scenario narrative
   - Huge animated vote bars with real-time percentages
   - Live epidemic curve
   - Chat command ticker: `TYPE 1, 2, OR 3 IN CHAT`

---

## 🕹️ Streamer Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `1` / `A` | Cast vote for Option 1 |
| `2` / `B` | Cast vote for Option 2 |
| `3` / `C` | Cast vote for Option 3 |
| `Space` / `Enter` | Close voting (if open) or Proceed to next scenario (if closed) |
| `N` / `→` | Advance to next scenario |
| `←` | Previous scenario |
| `F` | Toggle fullscreen mode |
| `M` | Mute / Unmute sound FX |
| `O` | Toggle OBS Overlay Mode |

---

## 🧪 Simulation Fallback

Testing offline or without an active Twitch chat?
- Click the **"Simulate Chat (50)"** button to instantly generate 50 realistic simulated viewer votes with natural stagger across options.

---

## 🔬 Epidemiological Scenarios

1. **Cholera Outbreak After Monsoon Flooding**
   - *Pathogen*: *Vibrio cholerae*
   - *Setting*: Displaced Persons Camp / River Delta
   - *Optimal Intervention*: Decentralized Oral Rehydration Therapy (ORT) + point-of-use water chlorination (WASH).
   - *Reference*: WHO Global Task Force on Cholera Control (GTFCC).

2. **Measles Cluster in an Elementary School**
   - *Pathogen*: *Measles morbillivirus*
   - *Setting*: Urban Primary School
   - *Optimal Intervention*: Post-exposure MMR vaccination within 72 hours + 21-day exclusion of susceptible contacts.
   - *Reference*: CDC Manual for Surveillance of Vaccine-Preventable Diseases.

3. **Malaria Resurgence in the Rainy Season**
   - *Pathogen*: *Plasmodium falciparum*
   - *Setting*: Sub-Saharan Agricultural Basin
   - *Optimal Intervention*: Artemisinin-based Combination Therapy (ACT) + Long-Lasting Insecticidal Nets (LLINs) + larval source management.
   - *Reference*: WHO Guidelines for Malaria Vector Control and Case Management.

---

## ⚖️ Disclaimer

**Educational simulation, not medical advice.**
