---
name: organogram
preamble-tier: 0
version: 1.0.0
description: |
  Builds a shareable org chart URL at organogram.pages.dev from any team/org data.
  Use when asked to "build me an organogram", "make an org chart", "visualise my team",
  "create an organogram for [data]", or "generate an org chart URL".
allowed-tools:
  - Bash
---

# Organogram Builder Skill

Turn any org/team data into a one-click URL that opens an interactive org chart at **organogram.pages.dev**.

## Your job

1. Parse the user's data into CSV rows
2. Write the CSV to a temp file
3. Run the encoder script to get the URL
4. Return the URL with a short summary

---

## CSV format

```
id,name,title,department,manager_id,is_open
```

| Column | Notes |
|---|---|
| `id` | Unique number or string per row |
| `name` | Display name. Use `N× Role` for bulk open positions (see below) |
| `title` | Job title shown on the card |
| `department` | Groups cards by colour in the legend |
| `manager_id` | `id` of their manager. Leave blank for the root node |
| `is_open` | `true` = unfilled open position (dashed card). `false` = filled |

**Root node:** exactly one row should have a blank `manager_id` — this is the top of the tree (CEO/founder/etc).

**N× open positions:** write `3× Frontend Engineers` as the name with `is_open: true` to auto-expand into 3 individual open-position cards. Accepts both `×` and `x`.

---

## Encoding script

After building the CSV, run this exact command to produce the URL:

```bash
node -e "
const fs = require('fs');
const csv = fs.readFileSync('/tmp/org.csv', 'utf8');
const encoded = Buffer.from(
  encodeURIComponent(csv).replace(/%([0-9A-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))),
  'latin1'
).toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
console.log('https://organogram.pages.dev/#data=' + encoded);
"
```

So the full flow is:

```bash
# 1. Write CSV to temp file (replace content with actual data)
cat > /tmp/org.csv << 'EOF'
id,name,title,department,manager_id,is_open
1,Alex Morgan,CEO,Leadership,,false
2,Sam Rivera,CTO,Engineering,1,false
EOF

# 2. Generate URL
node -e "
const fs = require('fs');
const csv = fs.readFileSync('/tmp/org.csv', 'utf8');
const encoded = Buffer.from(
  encodeURIComponent(csv).replace(/%([0-9A-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))),
  'latin1'
).toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
console.log('https://organogram.pages.dev/#data=' + encoded);
"
```

---

## Output to user

Return:
- The full clickable URL
- Brief summary: N people, N departments, N open positions
- Remind them they can click **Edit Data** on the page to tweak it live, and **Save** to store it in their browser

---

## Example

User says: *"Build an org chart for a startup: Sarah is CEO, Tom and Priya report to her (Tom is CTO, Priya is CPO), 2 open engineering roles under Tom."*

You would produce:
```csv
id,name,title,department,manager_id,is_open
1,Sarah,CEO,Leadership,,false
2,Tom,CTO,Engineering,1,false
3,Priya,CPO,Product,1,false
4,2× Engineers,Software Engineer,Engineering,2,true
```

Then run the encoding script and return the URL.
