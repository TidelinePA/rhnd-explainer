/* Smoke test for the redesign. Run from the repository root:  node docs/redesign/smoke-test.js
   Needs Playwright. Expected to fail until Phase 2 (routing) is complete. */
const { chromium } = require('playwright');
const path = require('path');
const base = 'file://' + path.resolve(__dirname, '../../index.html');
const ROUTES = [
  ['#/', null],
  ['#/number/built', 'How the number is built'],
  ['#/number/built/e4', 'Cost-burden adjustment'],
  ['#/number/table2/t11', 'Table 2'],
  ['#/number/income/i_al', 'Acutely'],
  ['#/number/cost-burden/alt1', '1,081,926'],
  ['#/process/meetings/m20261026/slides/sl19', 'Slide'],
  ['#/process/meetings/m20190603/agenda', '2019'],
  ['#/process/dates/d_obj', 'Nov 14, 2026'],
  ['#/law/s_b1H', '65584.01'],
  ['#/context/determinations', 'regional housing need determinations'],
  ['#/context/determinations/sacramento-area-council-of-governments', 'Sacramento'],
  ['#/context/letters/Orange', 'Orange County'],
  ['#/context/letters/Orange/city/Anaheim', 'Anaheim'],
  ['#/context/letters/all/concepts', 'Concepts'],
  ['#/this/route/does/not/exist', null]
];
(async () => {
  const b = await chromium.launch(); let fail = 0;
  for (const width of [1366, 390]) {
    for (const [hash, expect] of ROUTES) {
      const p = await b.newPage({ viewport: { width, height: 850 } });
      const errs = []; p.on('pageerror', e => errs.push(String(e)));
      await p.goto(base + hash); await p.waitForTimeout(200);
      const text = await p.evaluate(() => document.body.innerText);
      const sideways = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      const h1 = await p.evaluate(() => document.querySelectorAll('h1').length);
      const problems = [];
      if (errs.length) problems.push('JS error: ' + errs[0]);
      if (expect && !text.includes(expect)) problems.push('missing text "' + expect + '"');
      if (!text.includes('DRAFT for internal review')) problems.push('draft notice missing');
      if (sideways) problems.push('page scrolls sideways');
      if (h1 !== 1) problems.push(h1 + ' h1 elements');
      await p.reload(); await p.waitForTimeout(150);
      if (expect && !(await p.evaluate(() => document.body.innerText)).includes(expect)) problems.push('view lost on reload');
      if (problems.length) { fail++; console.log('FAIL', width, hash, '-', problems.join('; ')); }
      await p.close();
    }
  }
  console.log(fail ? fail + ' failures' : 'All routes passed');
  await b.close(); process.exit(fail ? 1 : 0);
})();
