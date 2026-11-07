/* Regional determinations module. Reads window.RHND (rhnd-data.js).
   Every number here is computed from the letters' own tables; nothing is typed in by hand. */
(function(){
  const $ = s => document.querySelector(s);
  const R = window.RHND || null;
  const kindLabel = {cog:"COG region", county:"County region", city:"City without a COG"};
  const state = {kind:"all", sort:"units", sel:null};
  const n = x => (x==null? "&ndash;" : Number(x).toLocaleString());
  const pct1 = x => (x==null? "" : (Math.round(x*10)/10)+"%");
  const esc = s => String(s==null? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const ext = (u,t) => '<a class="ext" href="'+u+'" target="_blank" rel="noopener">'+t+' &#8599;</a>';
  const letterUrl = (l,p) => "source/rhnd/"+l.file+(p? "#page="+p : "");
  const MON = {January:0,February:1,March:2,April:3,May:4,June:5,July:6,August:7,September:8,October:9,November:10,December:11};
  function plus30(dateStr){ const m = /^(\w+) (\d{1,2}), (\d{4})$/.exec(dateStr||""); if(!m) return null;
    const d = new Date(Date.UTC(+m[3], MON[m[1]], +m[2])); d.setUTCDate(d.getUTCDate()+30);
    return d.toISOString().slice(0,10); }
  function total(){ return (R? R.letters : []).reduce((a,x)=>a+(x.total||0),0); }

  (function(){ const st = document.createElement("style");
    st.textContent = '.rhbar{height:9px;border-radius:2px;background:#e6ebf3;position:relative;min-width:40px}'+
      '.rhbar i{position:absolute;left:0;top:0;bottom:0;border-radius:2px;background:var(--accent)}'+
      '.rhbar i.neg{background:#8fa7c4}.rhbar i.big{background:var(--contested)}'+
      '.rhrow{cursor:default}.rhrow.tot td{border-top:2px solid var(--line);font-weight:700;background:#f7f9fc}'+
      '.rhfiltsel{border-color:var(--navy)!important;box-shadow:inset 0 0 0 1px var(--navy)}'+
      '.rhtbl td.n{text-align:right;font-variant-numeric:tabular-nums}'+
      '.rhtbl tr.lk{cursor:pointer}.rhtbl tr.lk:hover{background:#f4f7fc}';
    document.head.appendChild(st); })();

  function facts(){
    const L = R? R.letters : [];
    const six = L.filter(x=>x.sixCat).length;
    const biggest = L.slice().sort((a,b)=>b.total-a.total)[0];
    const overdue = L.filter(x=>{ const c = plus30(x.date); return c && c < "2026-11-06"; }).length;
    return {L, six, four: L.length-six, biggest, overdue, sum: total()};
  }

  function table(){
    const f = facts();
    let rows = f.L.filter(x=> state.kind==="all" || x.kind===state.kind);
    rows = rows.slice().sort((a,b)=> state.sort==="units"? b.total-a.total
      : state.sort==="date"? (b.date||"").localeCompare(a.date||"") : (a.region||"").localeCompare(b.region||""));
    const maxU = Math.max.apply(null, rows.map(x=>x.total).concat([1]));
    const body = rows.map(l=>'<tr class="lk'+(state.sel===l.file?' sel':'')+'" data-rhnd="open|'+l.file+'" tabindex="0" role="button">'+
      '<td>'+esc(l.region)+'</td><td>'+kindLabel[l.kind]+'</td><td>'+esc(l.date)+'</td>'+
      '<td class="n"><b>'+n(l.total)+'</b></td>'+
      '<td class="n">'+(l.sixCat? 6 : 4)+'</td>'+
      '<td>'+esc(l.period||"&ndash;")+'</td>'+
      '<td>'+esc(l.heDue||"&ndash;")+'</td>'+
      '<td><div class="rhbar"><i style="width:'+Math.max(2, Math.round(l.total/maxU*100))+'%"></i></div></td>'+
      '<td>'+ext(letterUrl(l, l.incomePage), "Letter")+'</td></tr>').join("");
    return '<div class="card"><h2>7th cycle regional housing need determinations</h2>'+
      '<p class="hint">HCD issues one determination per region: the number of homes the region must plan for. This view holds <b>'+f.L.length+'</b> letters HCD has published so far, totalling <b>'+n(f.sum)+'</b> units &mdash; '+
      '<b>'+(f.biggest? Math.round(f.biggest.total/f.sum*100) : 0)+'%</b> of which is '+esc(f.biggest? f.biggest.region : "")+'. '+
      '<b>'+f.six+'</b> use six income categories; <b>'+f.four+'</b> were issued earlier under four (extremely low sat inside very low). Click a row for that region&rsquo;s own tables.</p>'+
      '<div class="hcdtoggle">'+
        ["all","cog","county","city"].map(k=>'<button class="'+(state.kind===k?'rhfiltsel':'')+'" data-rhnd="kind|'+k+'">'+
          (k==="all"? "All regions" : kindLabel[k])+' ('+f.L.filter(x=>k==="all"||x.kind===k).length+')</button>').join("")+
        '<button data-rhnd="sort|'+(state.sort==="units"?"date":state.sort==="date"?"name":"units")+'">Sort: '+
          (state.sort==="units"?"largest first":state.sort==="date"?"newest first":"A to Z")+'</button>'+
      '</div>'+
      '<table class="rhtbl"><tr><th>Region</th><th>Type</th><th>Letter date</th><th class="n">Units</th><th class="n">Income cats</th>'+
      '<th>Projection period</th><th>Housing element due</th><th>Relative size</th><th></th></tr>'+body+'</table>'+
      '<p class="src" style="margin-top:8px">'+esc(R? R.outstandingNote : "")+' '+ext(R? R.process : "#", "HCD&rsquo;s process page")+'. '+
      'Letters downloaded '+esc(R? R.downloaded : "")+' from '+ext(R? R.source : "#", "HCD&rsquo;s 7th cycle page")+'. Copies are hosted here; every figure links to its page.</p></div>';
  }

  function detail(l){
    const nav = '<div class="hcdnav"><button data-rhnd="back">&#8592; All regions</button>'+
      '<span class="crumb">Regional determinations / <b>'+esc(l.region)+'</b></span></div>';
    const steps = l.steps || [], inc = l.income || [];
    const maxStep = Math.max.apply(null, steps.map(s=>Math.abs(s.val)).concat([1]));
    const stepRows = steps.map(s=>'<tr class="rhrow"><td>'+(s.n==null? "" : s.n+". ")+esc(s.label)+'</td>'+
      '<td class="n">'+n(s.val)+'</td>'+
      '<td style="width:26%"><div class="rhbar"><i class="'+(s.val<0? "neg" : (Math.abs(s.val)===maxStep? "big":""))+'" style="width:'+
        Math.max(1, Math.round(Math.abs(s.val)/maxStep*100))+'%"></i></div></td></tr>').join("");
    const maxInc = Math.max.apply(null, inc.map(x=>x.units).concat([1]));
    const incRows = inc.map(x=>'<tr><td>'+esc(x.cat)+'</td><td class="n">'+pct1(x.pct)+'</td><td class="n"><b>'+n(x.units)+'</b></td>'+
      '<td style="width:34%"><div class="rhbar"><i style="width:'+Math.max(2, Math.round(x.units/maxInc*100))+'%"></i></div></td></tr>').join("");
    const cb = steps.find(s=>/cost-?burden/i.test(s.label||""));
    const big = steps.slice().sort((a,b)=>Math.abs(b.val)-Math.abs(a.val))[0];
    const qs = [];
    if(big && Math.abs(big.val) > 0) qs.push("The largest single line in HCD&rsquo;s own table is &ldquo;"+esc(big.label)+"&rdquo; at "+n(big.val)+
      " units. Is that the right lever for this region, and what does it rest on?");
    if(cb) qs.push("Cost burden adds "+n(cb.val)+" units ("+(l.total? Math.round(cb.val/l.total*100):0)+"% of this determination). "+
      "SCAG has objected to precisely this adjustment; what has this region said about it?");
    if(l.objection) qs.push("HCD&rsquo;s 30-day objection window ran from "+esc(l.date)+", closing "+plus30(l.date)+". Did "+esc(l.region)+
      " object, and is that on the record?");
    if(!l.sixCat) qs.push("This letter uses four income categories, with extremely low inside very low. AB 3093 later made acutely low and extremely low "+
      "categories of their own. How will this region&rsquo;s housing element report and plan for them?");
    if(l.kind==="county") qs.push("HCD set the need <i>and</i> wrote the allocation plan here, because the region has no council of governments. "+
      "Which local governments received units, and on what factors?");
    if(l.kind==="cog") qs.push("The council of governments writes the allocation from here. Which factors will it use for the 7th cycle, and what did it use last time?");
    if(/South Lake Tahoe/i.test(l.region||"")) qs.push("SACOG&rsquo;s determination subtracts this city&rsquo;s 291 units (step 21 of SACOG&rsquo;s table). "+
      "What does that mean for the city&rsquo;s own housing element schedule?");
    if(l.extended) qs.push("HCD extended this determination by 30 days to take in newly released ACS and DOF data, and the number here is the updated one. What changed?");
    const notes = [];
    if(l.corrected) notes.push("HCD marked this letter <b>corrected</b>.");
    if(l.kind==="county") notes.push("A county region with no council of governments, so HCD wrote the allocation plan as well as the determination.");
    if(!l.hasMethodology) notes.push("This letter is a short allocation notice: it has no methodology attachment, so there is no step table for it.");
    return nav + '<div class="card"><h2>'+esc(l.region)+'</h2>'+
      '<p class="hint">'+kindLabel[l.kind]+' &middot; letter dated '+esc(l.date)+' to '+esc(l.addressee||"the region")+' &middot; '+l.pages+'-page letter &middot; '+
      '<b>'+n(l.total)+'</b> units over '+(l.sixCat? "six":"four")+' income categories</p>'+
      '<div class="grid2">'+
        '<div><div class="sec"><h3>Projection period</h3><p>'+esc(l.period||"not stated in the letter")+'</p></div>'+
        '<div class="sec"><h3>Housing element due</h3><p>'+esc(l.heDue||"not stated in the letter")+'</p></div></div>'+
        '<div><div class="sec"><h3>The letter</h3><p>'+ext(letterUrl(l), "Full letter (PDF, "+l.pages+" pages)")+
          (l.incomePage? ' '+ext(letterUrl(l,l.incomePage), "Income table, p."+l.incomePage) : "")+
          (l.stepsPage? ' '+ext(letterUrl(l,l.stepsPage), "Steps table, p."+l.stepsPage) : "")+'</p></div>'+
        '<div class="sec"><h3>Source</h3><p>'+ext(R.source, "HCD&rsquo;s 7th cycle page")+'</p></div></div>'+
      '</div>'+
      (notes.length? '<div class="sec"><h3>Notes</h3><ul>'+notes.map(x=>'<li>'+x+'</li>').join("")+'</ul></div>' : '')+
      (steps.length? '<div class="sec"><h3>How the number is built (HCD&rsquo;s steps)</h3>'+
        '<p class="src">From the letter&rsquo;s methodology attachment, p.'+l.stepsPage+'. Bars show each line&rsquo;s size; the largest is in red.</p>'+
        '<table class="rhtbl steps"><tr><th>Step</th><th class="n">Units</th><th></th></tr>'+stepRows+
        '<tr class="rhrow tot"><td>Total &mdash; 7th cycle determination</td><td class="n">'+n(l.total)+'</td><td></td></tr></table></div>' : '')+
      '<div class="sec"><h3>Determination by income category</h3>'+
        '<table class="rhtbl inc"><tr><th>Income category</th><th class="n">Share</th><th class="n">Units</th><th></th></tr>'+incRows+
        '<tr class="rhrow tot"><td>Total</td><td class="n">100%</td><td class="n">'+n(l.total)+'</td><td></td></tr></table></div>'+
      (qs.length? '<div class="sec"><h3>Questions to ask</h3><ul>'+qs.map(q=>'<li>'+q+'</li>').join("")+'</ul></div>' : '')+
      '<div class="hcdnav" style="margin-top:14px"><button data-rhnd="back">&#8592; All regions</button>'+
      '<span class="crumb">Back to the region list</span></div></div>';
  }

  function viewHtml(){
    if(!R) return '<div class="card"><h2>Regional determinations</h2><p class="hint">rhnd-data.js did not load.</p></div>';
    if(state.sel){ const l = R.letters.find(x=>x.file===state.sel); if(l) return detail(l); state.sel = null; }
    return table();
  }
  function panelHtml(){
    if(!R) return "";
    if(!state.sel){ const f = facts();
      return '<h2>Regional determinations</h2><div class="sec"><p>Every 7th cycle regional housing need determination HCD has published, with each letter&rsquo;s own two tables: the income-category split and the step-by-step build.</p></div>'+
        '<div class="sec"><h3>In this set</h3><p><b>'+f.L.length+'</b> letters &middot; <b>'+n(f.sum)+'</b> units &middot; '+f.six+' with six categories, '+f.four+' with four</p></div>'+
        '<div class="sec"><h3>The biggest</h3><p>'+esc(f.biggest.region)+': <b>'+n(f.biggest.total)+'</b> ('+Math.round(f.biggest.total/f.sum*100)+'% of the set)</p></div>'+
        '<div class="sec src">Source: '+ext(R.source, "hcd.ca.gov/rhna/seventh-cycle")+', downloaded '+esc(R.downloaded)+'.</div>'; }
    const l = R.letters.find(x=>x.file===state.sel);
    return '<div class="hcdnav"><button data-rhnd="back">&#8592; All regions</button><span class="crumb">Region</span></div>'+
      '<h2>'+esc(l.region)+'</h2><div class="sec"><p>'+kindLabel[l.kind]+'<br>'+esc(l.date)+'<br><b>'+n(l.total)+'</b> units</p></div>'+
      '<div class="sec"><h3>Projection period</h3><p>'+esc(l.period||"&ndash;")+'</p></div>'+
      '<div class="sec"><h3>Letter</h3>'+ext(letterUrl(l), "Open the PDF")+'<br>'+(l.stepsPage? ext(letterUrl(l,l.stepsPage), "Steps table p."+l.stepsPage)+"<br>":"")+
      (l.incomePage? ext(letterUrl(l,l.incomePage), "Income table p."+l.incomePage) : "")+'</div>';
  }
  function render(){ if(window.__rhndRedraw) window.__rhndRedraw(); window.scrollTo(0,0); }

  document.addEventListener("click", function(ev){
    if(ev.target.closest("a.ext")) return;
    const el = ev.target.closest("[data-rhnd]"); if(!el) return;
    const raw = el.getAttribute("data-rhnd"), bar = raw.indexOf("|");
    const cmd = bar<0? raw : raw.slice(0,bar), arg = bar<0? "" : raw.slice(bar+1);
    if(cmd==="open") state.sel = arg;
    else if(cmd==="back") state.sel = null;
    else if(cmd==="kind") state.kind = arg;
    else if(cmd==="sort") state.sort = arg;
    render();
  });
  document.addEventListener("keydown", function(ev){
    if((ev.key==="Enter"||ev.key===" ") && ev.target.matches && ev.target.matches("tr.lk")){ ev.preventDefault(); ev.target.click(); }
  });
  window.RHNDTab = {view:viewHtml, panel:panelHtml, _state:state,
    reset:function(){ state.sel = null; }};
})();
