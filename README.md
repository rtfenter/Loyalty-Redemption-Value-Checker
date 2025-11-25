# Loyalty Redemption Value Integrity Checker  
[![Live Demo](https://img.shields.io/badge/Live%20Demo-000?style=for-the-badge)](https://rtfenter.github.io/Loyalty-Redemption-Value-Checker/)

### A small tool to test whether redemption value stays fair across markets and partners.

This project is part of my **Loyalty Systems Series**, exploring how loyalty systems behave beneath the UI layer — from event flow to FX reconciliation to partner tiering.

The goal of this checker is to make redemption value legible:

- How much is a point worth in each region?  
- Does a reward feel “worth it” in one market and “trash” in another?  
- Are some partners under- or over-valued relative to the program’s intent?  

Instead of guessing parity from spreadsheets, this prototype exposes a simple surface to compare value across markets and partners.

---

## Features (MVP)

The prototype includes:

- Inputs for:
  - Base point value in a reference currency (e.g., 0.01 USD)  
  - Two regions to compare (e.g., US vs EU)  
  - FX rates between those regions and the base currency  
  - A partner and reward cost (points + any cash co-pay)  
- A comparison view that shows:
  - Effective value per point in each region  
  - Value of the same redemption (e.g., “Free Night”, “$50 voucher”) across markets  
  - Whether the partner’s offer is under-, over-, or roughly aligned across regions  
- A simple “integrity signal”:
  - High parity  
  - Medium drift  
  - Broken parity  

---

## Demo Screenshot

<img width="2804" height="2280" alt="Screenshot 2025-11-25 at 09-42-23 Loyalty Redemption Value Checker" src="https://github.com/user-attachments/assets/2f755022-7b88-4129-b90b-410c171d04a6" />


---

## Redemption Value Integrity Flow

    [Base Point Value + FX Table]
                  |
                  v
          Normalize to Base Currency
        (e.g., all value into USD-equivalent)
                  |
                  v
        Region-Level Value Comparison
       (point value in Region A vs Region B)
                  |
                  v
      Partner Reward & Co-Pay Evaluation
       (points + cash vs local market value)
                  |
                  v
         Integrity Assessment & Signal
      (high parity / medium drift / broken)
                  |
                  v
        Human-Readable Explanation
      ("EU hotel night is 30% richer than US",
       "JP grocery reward is heavily diluted")

---

## Purpose

Redemption is where members feel the program’s truth:

- Earning can look generous while redemption quietly erodes value  
- FX shifts can create silent winners and losers across markets  
- Partner contracts can make some rewards disproportionately rich or poor  

Over time, programs end up with hidden value gradients:

- A “Free Night” that is worth far more in one region  
- A grocery partner that offers less than face value after FX  
- A catalog reward that feels like a bad deal in one currency  

This tool provides a small, understandable way to:

- Define a base point value  
- Compare the same reward across two regions  
- See whether value integrity holds or has drifted.

---

## How This Maps to Real Loyalty Systems

Even though it's minimal, each part corresponds to real architecture:

### Base Point Value & FX  
Real programs track point liability in a base currency. Point value (e.g., 0.5–1.0 cents) plus FX volatility determines how expensive a reward is to the business — and how satisfying it feels to members.

### Region-Level Value Comparison  
A reward priced at 10,000 points can represent very different purchasing power in different currencies, especially if FX tables or point values are updated at different cadences.

### Partner Reward & Co-Pay Evaluation  
Partners often fund part of the reward and may set their own value expectations. Co-pays (cash + points) complicate integrity: the same “Free Night” might have different required cash top-ups by region.

### Integrity Assessment  
Production systems rarely expose value parity as a first-class metric. This prototype treats “How fair is this reward across markets?” as a primary question, not an afterthought.

### Explanation Layer  
Operations, finance, and product teams need a shared language for drift: “EU is 20–30% richer than US on this reward.” This tool surfaces a tiny version of that alignment layer.

This checker is a legible micro-version of how redemption value drift shows up in real systems.

---

## Part of the Loyalty Systems Series

Main repo:  
https://github.com/rtfenter/loyalty-series

---

## Status  

MVP is implemented and active.  
Frontend implementation in progress — this prototype will remain intentionally lightweight and focused on detecting and explaining redemption value drift, not on modeling full catalog and liability behavior.

---

## Local Use

No installation required.  
Once implemented, to run the checker locally:

1. Clone the repo  
2. Open `index.html` in your browser  

Everything will run client-side.
