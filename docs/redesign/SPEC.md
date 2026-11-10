# RHND Explainer redesign: specification and design guide

Audience: the developer (human or AI model) who will implement the redesign.
Read this whole file before changing anything. Work phase by phase, in order.

Reference images are in `docs/redesign/mockups/`:

| File | Shows |
|---|---|
| `1-start-page.png` | The new start page |
| `2-the-number.png` | A section page with sub-navigation, chart and detail panel |
| `3-statewide-context.png` | The Statewide context section with cross-links |
| `*.html` | The static HTML/CSS that produced each image. Copy CSS values from these. They are pictures, not working code: do not copy their hard-coded content. |

---

## 1. Goal

The site holds a lot of good, well-sourced content behind nine equal-weight tabs. Readers cannot tell how the parts relate. The redesign does five things:

1. Groups the nine tabs into **four sections** with a two-level navigation.
2. Adds a **start page** that orients the reader and links into each section.
3. Makes **every view linkable** by putting the current view in the URL.
4. **Connects the two newer modules** (Regional determinations, HCD advice letters) to the rest of the site through links and search.
5. Applies **one visual system** (colour, type, components) so each section is recognisable.

This is a re-skin and re-organisation. **It is not a content rewrite.**

## 2. Hard rules

These apply in every phase.

1. **Do not change content.** Every number, sentence, citation, page reference and link inside the data must render exactly as it does today. This covers `ELEMENTS`, `LAWS`, `DATES`, `VOTES2026`, `COST`, `AGENDA`, `LIM`, `INCOME`, `STEPS`, `WORKBOOK`, `SLIDES` in `index.html`, and everything in `hcd-data.js`, `rhnd-data.js` and `past-data.js`. The only permitted data change is adding the `iso` field described in section 8.2.
2. **Do not touch `source/`.** No PDF is renamed, moved or deleted. All existing PDF links must keep working.
3. **Keep the site static.** Plain HTML, CSS and JavaScript. No framework, no build step, no package manager, no external scripts, fonts or stylesheets. It must work from GitHub Pages and when `index.html` is opened directly from disk (`file://`).
4. **Keep `<meta name="robots" content="noindex, nofollow, noarchive, nosnippet">`.**
5. **Keep the draft notice on every page**, with its full current wording: "DRAFT for internal review. Not an OCCOG position and not legal advice. This site represents a working analysis, for discussion."
6. **Keep the three data files as they are.** Do not regenerate or reformat them.
7. **Keep existing item ids** (`e4`, `s_b1H`, `t11`, `sl19`, `d_obj`, `a_item3`, `i_al`, `tab_cost`, `m20261026`, `pa_n`, `th_equity` and so on). Existing `rel` arrays and chips depend on them.
8. **One phase per commit**, on a branch, not on `main`. After each phase the site must work fully.
9. If something in this spec conflicts with what the code actually does, stop and report it. Do not guess.

## 3. How the site works today

Read this before reading the code. File sizes are approximate.

| File | What it is |
|---|---|
| `index.html` (1,103 lines) | All CSS, the page shell, the core data (lines 205 to 628) and the app script (lines 629 to 1098) |
| `hcd-data.js`, `hcd-module.js` | Data and view code for the "HCD advice" tab |
| `rhnd-data.js`, `rhnd-module.js` | Data and view code for the "Regional determinations" tab |
| `past-data.js` | Data for past and upcoming subcommittee meetings (`window.PAST`) |
| `source/` | Hosted PDFs |

### 3.1 App script in `index.html`

- `state = {tab, sub, mtg, sel, opt}` holds everything. `tab` is the top tab, `sub` is the sub-view inside the Subcommittee tab, `mtg` is the selected meeting, `sel` is the selected item id, `opt` is the selected cost-burden option (`hcd`, `alt1`, `alt2`).
- `byId` maps every item id to its object. Each object has a `type`: `element`, `law`, `date`, `agenda`, `income`, `step`, `slide`, `pastitem`, `theme`.
- `TABS` lists the nine top tabs. `TABOF` maps an item type to the tab that shows it. `SUBVIEWS` are the three sub-views of the Subcommittee tab (`tab_agenda`, `tab_slides`, `tab_themes`). `MEETINGS` is built from one hard-coded meeting (`m20261026`) plus `PAST.meetings`.
- `go(id)` is the single navigation function. It accepts an item id, a tab id, a sub-view id or a meeting id, updates `state`, and calls `render()`.
- `render()` rebuilds the tab bar, the main view (`#view`) and the detail panel (`#panel`) from `state` using `innerHTML`.
- One document-level click handler sends any element with a `data-go` attribute to `go()`. Elements with `data-opt` set `state.opt`.
- `chips(ids)` renders "Related" buttons. `nameOf(id)` gives the label.
- `INDEX` and `search(q)` implement search. They cover only the core data.
- At widths of 980px or less the detail panel becomes a slide-up sheet (`openSheet`, `closeSheet`).

### 3.2 The two modules

Both modules are self-contained and expose an object on `window`:

- `window.RHNDTab = {view(), panel(), reset(), _state}`. Its state is `{kind, sort, sel}`. `sel` is a letter's `file` name. It listens for clicks on `[data-rhnd="cmd|arg"]` with commands `open`, `back`, `kind`, `sort`. After a change it calls `window.__rhndRedraw()`.
- `window.HCDTab = {view(), panel(), _state}`. Its state is `{county, hcdSort}` plus a private history stack `stack`/`pos` of entries such as `{v:"cities"}`, `{v:"city", city}`, `{v:"letter", city, ix}`, `{v:"concepts"}`, `{v:"faq"}`, `{v:"dyk"}`. It listens for `[data-hcd="cmd|arg"]`. After a change it calls `window.__hcdRedraw()`.
- Both modules inject a few CSS rules with a `<style>` element at load.
- Neither module uses `data-go`, `go()` or the search index. That isolation is the main thing this redesign fixes.

### 3.3 Quirks to know about

- In `render()`, the lookup object lists the key `tab_slides` twice. It is harmless because `state.tab` is never `tab_slides`. Remove the duplicate when you rewrite that function.
- HCD letters are addressed by **array index** (`ix`), because `id` is not unique in `hcd-data.js` (1,264 letters, 1,102 distinct ids). Keep using the index.
- The Oct 26, 2026 meeting is defined in `index.html` (`AGENDA`, `SLIDES`, `VOTES2026`). All other meetings come from `past-data.js`. The Nov 12, 2026 meeting is in `past-data.js` with `upcoming: true`.

## 4. Information architecture

### 4.1 Sections and pages

Internal tab ids do not change. Only the grouping and labels change.

| Section (id) | Page label | Existing tab id | Notes |
|---|---|---|---|
| Start | Start | new: `tab_start` | New page, section 8 |
| **The number** (`number`) | How it is built | `tab_overview` | First page of the section |
| | HCD Table 2 | `tab_table2` | |
| | Income categories | `tab_income` | |
| | Cost burden | `tab_cost` | |
| **The process** (`process`) | Subcommittee meetings | `tab_subc` | Keeps its meeting picker and Agenda/Slides/Themes sub-views |
| | Dates | `tab_dates` | |
| **The law** (`law`) | The law | `tab_law` | One page, so no sub-navigation row |
| **Statewide context** (`context`) | Regional determinations | `tab_rhnd` | |
| | HCD advice letters (beta) | `tab_hcd` | Keep the "beta" badge |

Add one constant that describes this, and derive all navigation from it:

```js
const SECTIONS = [
  {id:"number",  label:"The number",        blurb:"What the 1,359,750 is made of, and which parts are open to challenge.",
   pages:[{tab:"tab_overview",slug:"built",label:"How it is built"},{tab:"tab_table2",slug:"table2",label:"HCD Table 2"},
          {tab:"tab_income",slug:"income",label:"Income categories"},{tab:"tab_cost",slug:"cost-burden",label:"Cost burden"}]},
  {id:"process", label:"The process",       blurb:"Who decides what, when, and what has been said so far.",
   pages:[{tab:"tab_subc",slug:"meetings",label:"Subcommittee meetings"},{tab:"tab_dates",slug:"dates",label:"Dates"}]},
  {id:"law",     label:"The law",           blurb:"What the statute requires, and where HCD is using its own judgment.",
   pages:[{tab:"tab_law",slug:"",label:"The law"}]},
  {id:"context", label:"Statewide context", blurb:"How the SCAG number and Orange County compare with the rest of California.",
   pages:[{tab:"tab_rhnd",slug:"determinations",label:"Regional determinations"},{tab:"tab_hcd",slug:"letters",label:"HCD advice letters",beta:true}]}
];
```

### 4.2 Which section an item belongs to

Used for chip colours, breadcrumbs and search grouping.

| Section | Item types and ids |
|---|---|
| `number` | `element`, `step`, `income`; tabs `tab_overview`, `tab_table2`, `tab_income`, `tab_cost` |
| `process` | `agenda`, `slide`, `pastitem`, `theme`, `date`; meeting ids; `tab_subc`, `tab_agenda`, `tab_slides`, `tab_themes`, `tab_dates` |
| `law` | `law`; `tab_law` |
| `context` | `tab_rhnd`, `tab_hcd`; the new search types `region`, `city`, `letter` |

Write one helper, `sectionOf(id)`, that returns the section id from this table.

## 5. URLs and routing

### 5.1 Approach

Use the URL hash. It works on GitHub Pages and from `file://` with no server configuration.

- `render()` ends by calling a new `syncHash()`. It builds the hash from the current state. If it differs from `location.hash`, it calls `history.pushState(null, "", hash)`. `pushState` does not fire `hashchange`, so there is no loop.
- A new `applyHash()` parses `location.hash`, sets the state, and calls `render()`.
- Call `applyHash()` once at start-up instead of the bare `render()`, and on both `popstate` and `hashchange`.
- **Start-up timing.** `hcd-module.js` and `rhnd-module.js` load after the app script, so the first `applyHash()` runs once the page has finished parsing (`DOMContentLoaded`, or at once if parsing is already done). Otherwise a module route opened in a fresh tab could not be applied.
- **pushState only for real navigation.** When `applyHash()` fills in or corrects a URL (an empty hash, `#/`, a section root such as `#/number`, a meeting with no sub-view, or an unrecognised hash), `syncHash()` writes the corrected hash with `history.replaceState`, so no extra history entry is created. `history.pushState` is used only when the reader navigates. Pushing during a correction would trap the Back button: Back would land on the incomplete URL, which would be corrected and pushed again.
- **Scroll to top on page change** (decided in Phase 5). When a click moves the reader to a different page (a different tab id, or the start page), scroll the window to the top. Do not scroll when an item is selected on the same page, and do not scroll on browser Back or Forward.
- **Default view.** An empty hash, `#/` and an unrecognised hash open the start page (`tab_start`, added in Phase 3). Between Phases 2 and 3 they opened the Subcommittee meetings page, meeting `m20261026`, Agenda.
- An empty, missing or unrecognised hash shows the start page. Never throw on a bad hash.
- `render()` also sets `document.title` to `<item or page name> · RHNA 7th Cycle (DRAFT)`.
- On phones, `applyHash()` closes the slide-up sheet when the route has no selected item and opens it when it has one.

Sort order and filter choices (`RHNDTab` `kind` and `sort`, `HCDTab` `hcdSort`) are **not** part of the URL.

### 5.2 Route table

`<id>` is always an existing item id. Parts in square brackets are optional.

| Route | State |
|---|---|
| `#/` | `tab_start` |
| `#/number/built[/<element id>]` | `tab_overview`, `sel` |
| `#/number/table2[/<step id>]` | `tab_table2`, `sel` |
| `#/number/income[/<income id>]` | `tab_income`, `sel` |
| `#/number/cost-burden[/<hcd\|alt1\|alt2>]` | `tab_cost`, `opt` |
| `#/process/meetings[/<meeting id>[/<agenda\|slides\|themes>[/<item id>]]]` | `tab_subc`, `mtg`, `sub`, `sel` |
| `#/process/dates[/<date id>]` | `tab_dates`, `sel` |
| `#/law[/<law id>]` | `tab_law`, `sel` |
| `#/context/determinations[/<region slug>]` | `tab_rhnd`, module `sel` |
| `#/context/letters[/<county>[/<view>[/<arg>]]]` | `tab_hcd`, module state |

Details:

- **Section root.** `#/number`, `#/process` and `#/context` with no page open the section's first page.
- **Meetings default.** `#/process/meetings` with no meeting opens the default meeting, which stays `m20261026` as today.
- **Region slug.** The letter's `file` with the prefix `hcd-7th-rhnd-` and the suffix `.pdf` removed. Example: `#/context/determinations/southern-california-association-of-governments`.
- **County.** The county name, URL-encoded, or `all` for "All California". The default is `Orange`, as today.
- **Letters views.** `<view>` is one of `city/<city name, URL-encoded>`, `letter/<array index>`, `concepts`, `faq`, `dyk`. No view means the city list.
- **Shortcut for parsing.** Item ids are unique across `byId`. If the last path segment is a key in `byId`, you may set the state by running the existing selection logic in `go()` for that id, then override `state.mtg` if the path contains a meeting id.

Examples that must work when pasted into a new browser tab:

```
#/number/built/e4
#/number/table2/t11
#/number/cost-burden/alt1
#/process/meetings/m20261026/slides/sl19
#/process/meetings/m20190603/agenda
#/process/dates/d_obj
#/law/s_b1H
#/context/determinations/sacramento-area-council-of-governments
#/context/letters/Orange/city/Anaheim
#/context/letters/all/concepts
```

### 5.3 Changes inside the modules

Each module gains two functions on its exported object and loses its private navigation:

- `route()` returns the path segments for its current state as an array of strings.
- `setRoute(segments)` sets its state from an array of segments, without rendering.
- `crumb()` returns an array of breadcrumb labels for its current state, for example `["Orange County", "Anaheim"]`.

In `hcd-module.js`:

- Replace the `stack`/`pos` history with a single "current view" object. `push(e)` sets it and calls `render()`. The browser's Back and Forward buttons now do this job.
- Remove the "Back" and "Forward" buttons from `nav()`. Keep the location text.
- Keep "Previous letter", "Next letter" and "All of <city>" in the letter view.

In `rhnd-module.js`:

- Keep the "All regions" button in the detail view. It sets `sel` to null as today.

The existing `__rhndRedraw` and `__hcdRedraw` hooks already call the main `render()`, which will now also call `syncHash()`. No other wiring is needed.

## 6. Page shell

See all three mock-ups. From top to bottom:

| Region | Content | Behaviour |
|---|---|---|
| Top bar | Site name, section links, search box | Sticky at the top. Height 60px. |
| Draft notice | Full draft wording (rule 5) | Scrolls with the page. |
| Section band | Section title, blurb, sub-page links | Not on the start page. Not sticky. |
| Main | View on the left, detail panel on the right | Grid `minmax(0,1.4fr) minmax(0,1fr)`, gap 22px. |
| Footer | Existing source notes, unchanged wording | |

### 6.1 Top bar

- **Site name:** "RHNA 7th Cycle" in bold, followed by "SCAG region explainer" in lighter text. Clicking it opens the start page. This name is a placeholder the owner may change, so keep it in one constant.
- **Section links:** "Start", then the four sections. Each section link has an 8px dot in its section colour. The active link has white bold text, a faint lighter background and a 3px bottom border in the section colour.
- **Search:** on the right. Placeholder text "Search all four sections…". Pressing `/` anywhere outside an input focuses it.
- The current long `<h1>` and sub-line are removed from the header. Their information moves to the start page hero (section 8) and stays in the footer. Each page must still have exactly one `<h1>`: the hero headline on the start page, the section title elsewhere.

### 6.2 Section band

- White background, a 4px top border in the section colour, a 1px bottom border.
- Section title at 24px bold, with the section blurb beside it in muted 14px text.
- Below, a row of sub-page links. The active one is bold with a 3px bottom border in the section colour. "The law" has only one page, so it shows no row.
- The Subcommittee page keeps its own meeting picker and Agenda/Slides/Themes row inside the page body, as today. That is a third level and stays visually lighter than the band.

### 6.3 Detail panel

The panel keeps its current content for every item type. Add a header above that content:

1. **Breadcrumb:** a section-colour dot, then `Section › Page › Item name`. Section and page are links. For module pages, take the trailing labels from the module's `crumb()`.
2. **"Copy link" button** at the right end of the breadcrumb row. It copies `location.href` with `navigator.clipboard.writeText`. If that is unavailable, select the URL in a temporary input and use `document.execCommand("copy")`. Show "Copied" for two seconds.

The start page has no panel. Give `<main>` a class there that makes it a single column and hides the `<aside>`.

When no item is selected, the panel shows its existing default text for that page.

**The panel belongs to the page** (decided in Phase 2; this replaces the carry-over behaviour on `main`, where an item selected on one page stayed in the panel after switching to another page, and a past meeting's description appeared on every page):

- The panel shows the current page's own selected item, or that page's default text.
- Switching page clears the selected item unless the item belongs to the new page (that is, unless the new page's URL can include it under section 5.2).
- The meeting description appears in the panel only on the Subcommittee meetings page.
- There is no separate remembered selection per page. Going to a page through a link shows its default panel; going back with the browser's Back button restores whatever the URL says.

### 6.4 "Related" becomes "Connected to"

Wherever `chips(ids)` renders a list under a "Related" heading:

- Rename the heading to "Connected to".
- Group the chips by section using `sectionOf`. Show a small section label in that section's colour to the left of each group, in the order number, law, process, context. See the right-hand panel in `2-the-number.png`.
- Give every chip a 7px dot in its target section's colour.
- Do not add or remove ids from any `rel` array.

Chips that appear elsewhere (themes, "Start here") get the dot but no grouping.

**Chip labels for pages** (decided in Phase 5). `nameOf()` returns the page's label from `SECTIONS` on its own for a page id, for example "Cost burden", instead of "Tab: <label>". The three Subcommittee sub-views keep their "Subcommittee: " prefix.

## 7. Design guide

### 7.1 Colour tokens

Replace the current `:root` block with this. After Phase 6, no hex colour may appear outside `:root`, in CSS or in JavaScript strings.

```css
:root{
  /* neutrals */
  --ink:#18202f; --ink-2:#3a4458; --muted:#5c667a; --line:#dfe3ea; --line-soft:#edf0f4;
  --bg:#f4f5f8; --card:#ffffff; --navy:#141d33;

  /* sections: solid colour and tint */
  --num:#2b5fa8;  --num-t:#eaf1fb;   /* The number */
  --proc:#1b7a6b; --proc-t:#e6f4f1;  /* The process */
  --law:#6a45a8;  --law-t:#f0ebf9;   /* The law */
  --ctx:#9a5a0c;  --ctx-t:#fbf1e2;   /* Statewide context */

  /* status scale: solid for bars, tint + ink for pills */
  --ok:#2f7d6d;      --ok-t:#e3f2ee;      --ok-ink:#1d5a4d;
  --warn:#c58b1a;    --warn-t:#fbf0d4;    --warn-ink:#7a5200;
  --bad:#b8382f;     --bad-t:#fbe9e7;     --bad-ink:#8f251e;
  --neutral:#5a6b8c; --neutral-t:#eceff5; --neutral-ink:#3d4a66;

  /* HCD letter severity, least to most serious */
  --sev-0:#2f7d6d; --sev-1:#5a6b8c; --sev-2:#3d6b8a; --sev-3:#c58b1a; --sev-4:#c2571f; --sev-5:#b8382f;

  /* draft notice */
  --draft-bg:#fff6dc; --draft-ink:#6b4e00; --draft-line:#ecd9a0;
}
```

Note: `--ctx` is darker than in the mock-up images (`#b0680f` there) so that white text on it meets contrast requirements. Use the value above.

**Decisions made during Phase 1 (owner, recorded here so this spec stays the single source of truth):**

1. **Old token names are renamed, not aliased.** The previous `:root` defined five names that this block does not. Every reference in `index.html`, `hcd-module.js` and `rhnd-module.js` is renamed to the token with the identical value, and the old names are not kept in `:root`. After Phase 1 a search for the five old names returns nothing.

   | Old | New |
   |---|---|
   | `--low` | `--ok` |
   | `--lowmod` | `--warn` |
   | `--contested` | `--bad` |
   | `--helps` | `--neutral` |
   | `--accent` | `--num` |

   Exception: HCD letter severity uses the severity ramp, not the status scale. `SEVCOL` in `hcd-module.js` is `["var(--sev-0)","var(--sev-1)","var(--sev-2)","var(--sev-3)","var(--sev-4)","var(--sev-5)"]`, the `.sev0` to `.sev5` CSS rules use the same six tokens, and so does the severity legend in the HCD city list (it is the key for `SEVCOL`). The hex values are identical, so nothing changes visually.
2. **White: backgrounds now, text in Phase 7.** White used as a background (cards, buttons, inputs, tabs, result rows, the slide-up sheet) becomes `var(--card)` in Phase 1. White used as text or an icon on a dark or solid-colour background (header, pills, tags, selected tabs, status pills, severity tags, the "beta" badge) stays `#fff` until Phase 7, which adds `--on-dark:#ffffff` for it. `rgba(...)` values are left as they are in Phase 1.
3. **Hard-coded copies of old token values are tokenised.** `#1c2433` becomes `var(--ink)`, `#1f2a44` becomes `var(--navy)`, `#5d6678` becomes `var(--muted)`; the draft notice uses `var(--draft-bg)`, `var(--draft-ink)` and `var(--draft-line)` (was `#fff4d6`, `#6b4e00`, `#ecd9a0`). These shift by a shade because the new token values differ slightly. That is intended.
4. **SVG colours are set through a `style` attribute**, for example `style="fill:var(--ink)"`, never `fill="var(--ink)"`. This includes the chart bars that take their colour from `LEVELS`.
5. Hex values with no exact token match (search-tag colours, chip and link blues, `#3b4558`, row-hover tints and so on) stay as they are until Phase 7.

**Decisions made during Phase 7B (owner, recorded here so this spec stays the single source of truth):**

6. **New tokens (Phase 7B).** Exactly two colour tokens were added to `:root`, plus one layout variable. Every other former hard-coded colour maps to a token that already existed.

   | Token | Value | Reason |
   |---|---|---|
   | `--on-dark` | `#ffffff` | White text on dark or solid-colour backgrounds (top bar, section pills, search tags, severity tags, primary button). Replaces the eight `#fff` text colours that Phase 1 deferred. |
   | `--bar-muted` | `#b4bdcf` | The un-highlighted bar in the cost-burden options and the past-cycles meter (§7.2), and the muted text on the navy top bar (inactive links, brand sub-line, search placeholder). Its contrast on `--navy` is 8.9 to 1. |
   | `--gut` (layout, not a colour) | `max(40px, calc((100vw - 1440px) / 2 + 40px))` | Page gutter of §7.4: 40px, with content capped at 1440px and centred on wider screens. It is 22px at 980px or less and 16px at 700px or less. |

   Two helper properties, `--sec` and `--sec-t`, are set on `body` from `data-sec` (the page's section). They are aliases of `--num`/`--proc`/`--law`/`--ctx` and their tints, not new colours. They carry the §7.2 rule that selected rows, list items, chart rows and bars use the page's section colour (so they are `--ctx` on Statewide context pages).
7. **`--sev-4` changed from `#c2571f` to `#be551e` (HCD severity, owner choice 1A).** White text on `#c2571f` was 4.49 to 1, below the 4.5 to 1 rule. On `#be551e` it is 4.66 to 1. The ramp, the stage order and the text labels are unchanged.
8. **HCD severity stage 3 uses `--ink` text (owner choice 1A).** White on `--sev-3` (`#c58b1a`) is 2.97 to 1; `--ink` on it is 5.5 to 1. The other four stages keep white text (4.91 to 5.76 to 1).
9. **Cost-burden option bars (owner choice 2A).** The bar of the option the reader has selected uses `--num`; the other two use `--bar-muted`. The highlight moves when the reader selects another option. (Before Phase 7B each bar had its own fixed colour.)
10. **Level pills and date-status pills** use the status tint with the `-ink` text (§7.2): the "how challengeable" pill in a Table 2 chart-bar panel (`LEVELS`, class `lv-ok` and so on) and the confirmed / tentative / unverified / derived pills. The "beta" badge uses `--warn-t` with `--warn-ink`.
11. **Item-type pills** take the colour of the item's section: Law is `--law`; Date, Agenda, Theme, Past meeting and Committee report slide are `--proc`; Income category and Table 2 are `--num`. The pill text is unchanged.
12. **Translucent white and shadows** are written with `color-mix(in srgb, var(--on-dark) N%, transparent)` and `color-mix(in srgb, var(--navy) N%, transparent)`, so no `rgb()` or `rgba()` colour appears outside `:root`. The dropdown and the phone sheet keep their overlay shadow; cards have none.
13. **Navy** is used only for the top bar, the "Total" bar in the waterfall chart and, as `color-mix`, the sheet scrim and shadows. Selected toggles, the meeting picker, the timeline dots and the "Letters by year" bars take the page's section colour.
14. **Focus ring.** `outline: 2px solid var(--num); outline-offset: 2px` on every link, button, input, select and `[tabindex]` element (`:focus-visible`). Inside the navy top bar the ring is `--on-dark`, because `--num` on `--navy` is only 2.5 to 1. Chart rows, which are SVG groups, also stroke their background rectangle.

### 7.2 What each colour means

A colour must mean one thing.

| Colour group | Used for | Never used for |
|---|---|---|
| Section colours | Navigation, band border, breadcrumb dot, chip dots, item-type pills, selected-row highlight, links into that section | Status or severity |
| Status scale | The meaning in the table below | Identifying a section |
| Severity ramp | HCD letter stage only | Anything else |
| Navy | Top bar, the "Total" bar in charts | |

Status scale meaning, applied identically everywhere:

| Token | Chart "how challengeable" (`LEVELS`) | Date status (`.st`) |
|---|---|---|
| `--ok` | Low | confirmed |
| `--warn` | Low to moderate | tentative |
| `--bad` | Contested: the objection | unverified |
| `--neutral` | Helps SCAG (HCD choice) | derived |

Changes this requires:

- `LEVELS[...].color` values become `var(--ok)` and so on. Labels do not change.
- **Item-type pills** in the panel currently use eight different colours (law purple, date orange, agenda teal, theme violet, income brown, Table 2 green, slide magenta, past meeting violet). Replace each with the colour of the item's section. The pill text ("Law", "Date", "Agenda", "Table 2" and so on) stays.
- **Search result tags** follow the same rule.
- **Status pills** (`.st`) use the tint as background and the `-ink` colour as text, not white on solid. White on `--warn` is not readable.
- **The "beta" badge** uses `--warn-t` background with `--warn-ink` text.
- The cost-burden option bars and the past-cycles meter use `--num` for the highlighted bar and `--line` darkened (`#b4bdcf`, add as `--bar-muted`) for the others.

### 7.3 Type

Font stack, unchanged in spirit and with no web font download:

```css
font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
```

| Role | Size / line height | Weight | Other |
|---|---|---|---|
| Hero headline (start page `h1`) | 40px / 1.12 | 700 | letter-spacing −0.022em |
| Section title (band `h1`) | 24px / 1.2 | 700 | −0.01em |
| Panel item title | 23px / 1.2 | 700 | −0.015em |
| Card title (`h2`) | 20px / 1.3 | 700 | −0.01em |
| Stat figure | 27px / 1.1 | 700 | −0.02em |
| Lead paragraph | 17px / 1.5 | 400 | colour `--ink-2` |
| Body | 15px / 1.5 | 400 | |
| Secondary text, hints | 13.5px / 1.45 | 400 | colour `--muted` |
| Table body | 13.5px | 400 | numbers use `font-variant-numeric: tabular-nums` |
| Label (`h3`, table headers, eyebrows) | 11.5px | 600 | uppercase, letter-spacing 0.07em, colour `--muted` |
| Chips, pills | 12.5px / 11.5px | 400 / 600 | |

At 700px wide or less: hero headline 28px, section title 20px, panel item title 20px.

### 7.4 Spacing, shape and layout

- **Spacing scale:** 4, 6, 8, 12, 16, 22, 32, 40px. Do not invent other values.
- **Page gutters:** 40px each side at desktop, 16px at 700px or less.
- **Card:** background `--card`, 1px `--line` border, 12px radius, padding 20px 22px. No drop shadows on cards.
- **Gaps:** 22px between the two columns, 18px between stacked cards.
- **Radius:** 12px cards, 9px inner boxes and tiles, 8px buttons and inputs, 99px chips and pills.
- **Maximum content width:** none at laptop sizes; cap `main` and the band content at 1440px and centre them on wider screens.

### 7.5 Components

Take exact CSS from the mock-up HTML files. Summary:

| Component | Specification |
|---|---|
| Primary button | Section-colour background, white text, 14px 600, padding 9px 16px, radius 8px |
| Secondary button | White background, 1px `--line` border, `--ink` text, same size |
| Chip | White, 1px `--line` border, radius 99px, padding 4px 11px, 12.5px, with a 7px section dot. Hover: section tint background. |
| Pill | 11.5px 600, padding 2px 9px, radius 99px |
| Stat tile | Card with 16px 18px padding; figure in the relevant section or status colour; one line of muted text below |
| Selected row (table, list, chart) | Section tint background plus a 4px left bar (lists, tables) or 1.5px outline (chart rows) in the section colour |
| Quote block (statute text) | 3px left border `--law`, background `--law-t`, padding 8px 12px, 13.5px |
| Cross-link box | White, 1px `--line` border, 4px left border in the **target** section's colour, radius 9px, padding 11px 14px; bold title, muted one-line description, arrow at right in the target colour. See panel in `3-statewide-context.png`. |
| External link (`a.ext`) | Keep the current small bordered style and the "↗" mark. Use `--num` for text. |
| Search results | Dropdown under the search box, grouped by section, section name as a label in its colour |

Every clickable element needs a visible focus style: `outline: 2px solid var(--num); outline-offset: 2px`.

### 7.6 Phone and tablet

Breakpoints stay at 980px (panel becomes a slide-up sheet) and 700px.

At 980px or less:

- The top bar becomes two rows: site name and a search field on the first; the five links on the second as a **single horizontally scrolling row** that never wraps. Only this second row is sticky.
- The band's sub-page links are also a single scrolling row.
- Main is one column. The slide-up sheet behaviour is unchanged, and the sheet shows the breadcrumb and "Copy link" at its top.
- Keep the "Tap any row or bar for details." hint on pages that have a panel.

At 700px or less:

- Start page: hero stacks (headline, then "Coming up"); stat tiles two per row; takeaways and section cards one per row.
- The "How it is built" chart switches to a phone layout: each step shows its label and value on one line with its bar beneath, at normal text size. The wide chart is unchanged above 700px. Both are drawn; CSS shows one.
- No page may scroll sideways. Wide tables scroll inside their own card (section 9.4).

## 8. Start page

Route `#/`. Full width, no detail panel. See `1-start-page.png`. Blocks from top to bottom:

### 8.1 Hero (left)

| Element | Text |
|---|---|
| Eyebrow | 7th Cycle Regional Housing Needs Determination · SCAG region |
| Headline (`h1`) | How the state arrived at 1,359,750 homes, and what can still change. |
| Lead | HCD issued the determination on October 15, 2026. This site takes the number apart step by step, and ties every step to the statute, the meeting record, and the source page. |
| Primary button | "See how the number is built →" opens `#/number/built` |
| Secondary button | "The cost-burden objection" opens `#/number/cost-burden` |

Build the figure in the headline from the `TOTAL` constant.

### 8.2 "Coming up" (right)

A box listing the next two dated events, computed from `DATES`, so it never goes stale.

Add an `iso` field to each entry in `DATES`. This is the only permitted data change:

| id | iso |
|---|---|
| `d_oct15` | `2026-10-15` |
| `d_oct26` | `2026-10-26` |
| `d_nov5` | `2026-11-05` |
| `d_nov12` | `2026-11-12` |
| `d_obj` | `2026-11-14` |
| `d_final` | `2026-12-29` |
| `d_jan` | `2027-01-29` |
| `d_meth` | `2027-03-11` |
| `d_alloc` | `2027-10-01` |
| `d_apr28` | `2028-04-01` |
| `d_he` | `2029-10-15` |
| `d_label` | none (leave it out) |

Rules:

- Take entries whose `iso` is today or later, sort ascending, show the first two.
- Each row shows a date tile (month and day), the entry's existing `title`, its existing `date` text, its status pill, and a link "Open →". If a meeting in `MEETINGS` has the same `iso` date as the entry, the link opens that meeting's agenda, `#/process/meetings/<meeting id>/agenda`; otherwise it opens `#/process/dates/<id>`. Match by `iso` only, never by hard-coded id.
- On the Dates page, the detail panel of any date that matches a meeting the same way shows one cross-link box, "Open this meeting's agenda", to the same route.
- Box heading: "Coming up".
- If no entry is in the future, do not render the box, and let the hero take the full width.
- The mock-up shows hand-written sub-lines under each event ("Thursday, 1:00 PM · …"). Do not reproduce those. Use only the fields above.

**Dates page order (owner decision, after Phase 7B; replaces the earlier "newest first" rule):**

- The Dates page (`#/process/dates`) shows the next upcoming date at the top. It sorts at display time using `iso` and today's date in the browser's local time, the same way "Coming up" does. The `DATES` array itself is not reordered.
- First group, under the small label "Upcoming": entries dated today or later, soonest first. An event stays in "Upcoming" through its own day. Entries with no `iso` (today only "Open item", `d_label`) go at the end of this group, in their existing order.
- Second group, under the small label "Past": entries dated before today, most recent first.
- The labels use the existing small group-label style (`.grp`). If a group is empty, its label is not shown.
- Selecting, linking to and the URL of each date are unchanged (`#/process/dates/<id>`).
- This applies to any entry added later. Every new dated entry needs an `iso` value in `YYYY-MM-DD` form; a comment above `DATES` says so.
- The "Coming up" box above is unchanged: it still shows the next two future dates, soonest first.

### 8.3 Headline figures

Four stat tiles. Reuse the four existing "glance" strings from `overview()` unchanged. Then **remove the glance row from the "How it is built" page**, since it now lives here.

### 8.4 "Three things to know"

One card with the three existing "Three takeaways" bullets, taken unchanged from the default text in `panel()`.

### 8.5 "Explore by section"

Heading "Explore by section", with the sub-line "Each colour follows its section through the whole site."

Four cards in a two-by-two grid, one per entry in `SECTIONS`. Each has a 4px top border in the section colour, a numbered badge, the section label, "Open →" linking to the section's first page, the section blurb, and one row per link below. Each row is a link.

| Section | Row label | Row description | Opens |
|---|---|---|---|
| The number | How it is built | Nine steps, from household growth to the total | `#/number/built` |
| | HCD Table 2 | Every step of the calculation, with its statute | `#/number/table2` |
| | Income categories | Six categories, in Orange County dollars | `#/number/income` |
| | Cost burden | The contested adjustment and two alternatives | `#/number/cost-burden` |
| The process | Subcommittee meetings | *N* meetings: agendas, slides, votes | `#/process/meetings` |
| | Dates | From the determination letter to housing elements due | `#/process/dates` |
| | Themes | Topics that recur across the past meetings | `#/process/meetings/<first past meeting>/themes` |
| The law | Gov. Code §65584.01 | Provision by provision, in plain terms | `#/law` |
| | The objection standard | What SCAG must show to object | `#/law/s_c2` |
| Statewide context | Regional determinations | *N* letters, *T* units; SCAG is *P*% | `#/context/determinations` |
| | HCD advice letters (beta) | *N* letters to *M* jurisdictions; *K* in Orange County | `#/context/letters` |
| | Concepts and connections | What recurs, and how letters chain together | `#/context/letters/Orange/concepts` |

Compute every italic value from the data (`MEETINGS.length`, `RHND.letters`, `HCD_DATA.meta`, the Orange entry in `HCD_DATA.meta.counties`). Do not type numbers in. Before using `s_c2` for "The objection standard", read its entry in `LAWS` and confirm it is the objection-standard provision; if it is not, link the row to `#/law` instead.

### 8.6 "Most used"

One row of chips using the existing "Start here" ids: `a_item3`, `e4`, `i_al`, `sl19`, `d_obj`, `tab_cost`. Then remove the "Start here" block from the default panel text, since it now lives here. Keep the "How to use this" paragraph in the default panel.

## 9. Cross-links and search

### 9.1 Linking into the modules

Links that point at a module route are ordinary anchors, for example `<a href="#/context/determinations">`. The router handles them. Links that point at a core item keep using `data-go="<id>"`; the document-level click handler already catches these inside module markup too.

### 9.2 Links to add

Add exactly these. Each is a cross-link box (section 7.5) unless stated. Do not add other new prose.

| Where | Link text | Target |
|---|---|---|
| "How it is built" page, under the chart legend | "Compare with the other regions HCD has determined →" | `#/context/determinations` |
| SCAG region detail and its panel, under a heading "This is the number the rest of the site explains" | "How the 1,359,750 is built" | `tab_overview` |
| same | "The cost-burden objection" | `tab_cost` |
| same | "Oct 26 subcommittee vote" | `m20261026` |
| same | "HCD advice letters in Orange County" | `#/context/letters/Orange` |
| Any region detail whose steps include a cost-burden line, after "Questions to ask" | "How SCAG's cost-burden adjustment was calculated" | `tab_cost` |
| HCD letters, "Questions" view, under the existing answer to "How does this connect to RHNA?" | Two chips: "How the number is built", "Regional determinations" | `tab_overview`, `#/context/determinations` |
| HCD letters default panel | "Orange County housing elements due: Oct 15, 2029" | `d_he` |
| Panel for date `d_he` | "HCD advice letters in Orange County" | `#/context/letters/Orange` |

Identify the SCAG letter by testing its `region` for "SCAG". Build figures in link text from data.

### 9.3 Search

Extend `INDEX` so the placeholder "Search all four sections…" is true:

| New type | One entry per | Title | Searchable text | Opens |
|---|---|---|---|---|
| `region` | `RHND.letters` item (20) | region name | region, kind label, date, total | its determinations route |
| `city` | `HCD_DATA.cities` item (473) | "*City*: *k* HCD letters" | name, county | its city route |
| `letter` | `HCD_DATA.letters` item (1,264) | "*City*, *date*: *letter type*" | `city`, `t`, `s`, `kw` | its letter route (by index) |

Results display:

- Group results by section, in the order number, process, law, context, each under a label in the section colour.
- Show at most five results per section. If a section has more, end the group with "*n* more in this section".
- Each result keeps its type tag, coloured by section.
- Entries may carry either an `id` (use `data-go`) or an `href` (use an anchor).
- Arrow keys move through results, Enter opens, Escape closes.

### 9.4 Layout fix in Regional determinations

At laptop width the table is wider than its card and the "Letter" buttons are clipped. Fix:

- Move "Type" and "Income cats" out of their own columns into a muted second line under the region name, for example "COG region · 6 income categories".
- Final columns: Region, Letter date, Units, Relative size, Projection period, Housing element due, Letter.
- Wrap the table in a container with `overflow-x: auto` so it scrolls inside the card if it still does not fit.

`3-statewide-context.png` shows the list and a region summary side by side for illustration. **Keep the existing behaviour instead:** clicking a row replaces the list with the full region detail in the left column, and the right panel shows the region summary plus the cross-link boxes.

## 10. Phases

Do them in order. Commit after each. Run the checks in section 11 after each.

| Phase | Work | Done when |
|---|---|---|
| **1. Tokens** | Replace `:root` with the block from 7.1. Rename the five old token names as listed in 7.1, with HCD severity on `--sev-0` to `--sev-5`. Replace existing hex values in CSS and JS strings with tokens where a matching token exists, white backgrounds to `--card` (white text stays `#fff` until Phase 7), plus the copies of old token values listed in 7.1. Set SVG colours through `style` attributes. Move the two modules' injected `<style>` rules into the main stylesheet. | The site looks almost the same as before and behaves identically. A search for `--low`, `--lowmod`, `--contested`, `--helps` and `--accent` returns nothing. |
| **2. Routing** | Section 5: `syncHash`, `applyHash`, module `route`/`setRoute`/`crumb`, remove HCD Back/Forward, set `document.title`. | Every example URL in 5.2 opens the right view in a fresh tab. Browser Back and Forward step through views. Reload keeps the view. |
| **3. Navigation** | Sections 4 and 6.1 to 6.2: `SECTIONS`, top bar, section band, sub-page links, phone navigation. The start page can be a stub with the four section links. | Nine pages reachable through four sections. Old tab bar gone. No wrapped navigation at 390px wide. |
| **4. Start page** | Section 8. | Matches `1-start-page.png` in structure. All figures computed from data. "Coming up" changes correctly when you fake the date. |
| **5. Panel and links** | Sections 6.3, 6.4, 9.1, 9.2. | Breadcrumb and "Copy link" on every panel. Chips grouped and coloured. Every link in 9.2 present and working. |
| **6. Search** | Section 9.3. | Searching "Anaheim", "Sacramento", "cost burden" and "65584" each returns grouped results that open correctly. |
| **7. Skin and fixes** | Sections 7.2 to 7.6 and 9.4: colour meanings, type scale, components, phone layout, table fix, focus styles. Add `--on-dark:#ffffff` to `:root` and use it for white text on dark or solid-colour backgrounds. In the "Where this sits among past cycles" table on "How it is built", rebalance the columns so Period stays on one line at desktop width (today the Cycle column takes 46% of the width and Period wraps, as in "2006-" / "2014"). | Matches the mock-ups. No hex colour outside `:root`. No sideways scroll at 390px. |

## 11. Checks

### 11.1 After every phase

1. Open the browser console. There must be no errors on load or while clicking through every page.
2. Run `node docs/redesign/smoke-test.js` from the repository root (it needs Playwright). It loads a list of routes and reports failures. From Phase 7A on, it must print "All routes passed"; any failure is a real failure.
3. Click one item on each of the nine pages and compare the panel text with the live site on `main`. The wording must be identical.
4. Check at 1366px, 980px and 390px wide.

### 11.2 Content regression check

Before starting, save the text of every view from `main`. After Phase 7, confirm nothing was lost:

- All 9 chart bars, 6 income rows, every `STEPS` row, 16 workbook rows, 22 slides, every `DATES` entry, every `LAWS` entry.
- All 9 meetings with every agenda item, and the 5 themes.
- All 20 regional determinations with both tables each.
- HCD letters: the Orange County city list, one city, one letter, and the Concepts, Questions and "Did you know" views.
- Every "p." and PDF link opens the same file as before.

### 11.3 Accessibility

- One `<h1>` per page. Headings do not skip levels.
- Navigation is in `<nav>` elements with `aria-label`s; the active link has `aria-current="page"`.
- Every interactive element is reachable by Tab and operable by Enter or Space, with a visible focus ring.
- Text contrast is at least 4.5 to 1. Use the `-ink` on tint combinations for status pills.
- Colour is never the only signal: status pills and severity tags keep their text labels.

### 11.4 Print

Keep the existing print rule. Hide the top bar, band links and search when printing; show the view and panel one after the other.

## 12. Out of scope

Do not do these, even if they look like improvements:

- Rewriting, shortening or "improving" any content.
- Dark mode.
- A framework, bundler, TypeScript or CSS preprocessor.
- Splitting `index.html` into many files. (Moving the CSS into one `styles.css` is acceptable if it makes the work easier; nothing else.)
- Changing how the data files are generated.
- Analytics, cookies, or any network request to a third party.
- Removing the "noindex" tag or the draft notice.

## 13. Decisions the owner may change

These are placeholders. Each lives in one place so it can be changed in a minute.

| Decision | Default in this spec | Where it lives |
|---|---|---|
| Site name | "RHNA 7th Cycle · SCAG region explainer" | One constant used by the top bar and `document.title` |
| Section names | The number, The process, The law, Statewide context | `SECTIONS` |
| Section colours | Blue, teal, purple, ochre | `:root` tokens |
| Hero headline and lead | Text in 8.1 | Start page function |
