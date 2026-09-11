# Prop Firm PDF Listing Workflow

Use this workflow whenever a new prop-firm PDF is supplied for an existing website listing.

## Source-of-truth rules

- Treat the supplied PDF as the only source for rule, challenge, platform, payout, leverage, and related display values.
- Fill only fields that already exist in the Rank My Prop admin/listing structure.
- If a required website field is absent from the PDF, enter exactly `Not mentioned`.
- Use `Not applicable` only when the field genuinely does not apply to that program (for example, Phase 2 for a one-step or instant model).
- Do not guess, infer, embellish, or add unsupported details.
- Preserve contradictions or date-dependent changes explicitly instead of choosing one version silently.
- Do not overwrite identity, routing, logo, affiliate link, rating, offer, ranking, SEO, or publication fields unless the user specifically requests it.

## Required sequence

1. Read the complete PDF carefully, including tables, footnotes, exceptions, dates, payout clauses, and model-specific rules.
2. Identify every distinct evaluation and instant-funding model.
3. Map PDF content into the existing admin fields and challenge/rules panels.
4. Save a complete pre-change JSON backup of the firm record in `backups/`.
5. Prepare a proposed JSON payload before changing the live record.
6. Update only the approved firm record.
7. Verify the public Overview, Challenges, Rules, and responsive layouts.
8. Run the production build and deploy only when requested.

## Listing field layout

Keep this field structure and ordering:

- `platforms`
- `paymentMethods`
- `keyMetrics`: concise label/value pairs supported by the PDF
- `cardMetrics`: payout cycle, minimum trading days, news trading, time limit, EA allowance, starting price
- `tradingConditions`: daily loss, maximum loss, drawdown type, minimum days, time limit, news trading, weekend/overnight holding, consistency rule
- `firmDetails`: only existing required labels; unsupported values become `Not mentioned`
- `leverageRows`: one row per instrument with evaluation/funded/instant values as applicable
- `commissions`
- `restrictedCountries`
- `evaluationPrograms`
- `challengesPanelData`
- `rulesPanelData`

Each challenge program uses:

```json
{
  "program": "Program name",
  "phase1": "Not mentioned",
  "phase2": "Not mentioned",
  "target": "Not mentioned",
  "allocation": "Not mentioned",
  "split": "Not mentioned",
  "features": []
}
```

Each model must also get a matching rules entry/slug when the PDF contains model-specific rules.

## Layout requirements

- Reuse the existing Challenges table in `public/challenges-panel.html`.
- Keep the action column and `Start Now` button fully visible.
- Long Key Features text must wrap naturally; never force it onto one line.
- Do not break the established desktop or mobile design.
- Keep feature text concise while retaining every material qualifier from the PDF.

## Rules-only firm visibility preset

For a firm that should publish rules and accept reviews without being listed as a normal prop firm, use **Preset: Rules + Reviews + Offers Only** in Firm Detail CMS. It sets:

- Dedicated firm profile: off
- Home ranking table: off
- Listed Props and Best Prop: off
- Rules pages: on
- Reviews pages: on
- Offers: on, but the firm appears there only after its offer record is activated

All visibility switches are independent and can be changed later without deleting the firm or its challenge models.

## Saved reference from the trial

- Pre-change rollback record: `backups/gft-trial-before-2026-08-24.json`
- Approved structure example: `backups/gft-trial-proposed-2026-08-24.json`
- Trial firm: Goat Funded Trader, containing seven models.

This reference is a schema/layout example only. Values from Goat Funded Trader must never be copied into another firm's listing unless that firm's own PDF states them.
