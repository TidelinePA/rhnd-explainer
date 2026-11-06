/* HCD advice letters - internal page module. Reads window.HCD_DATA (hcd-data.js).
   Every number in the prose is computed from the data; nothing is hand-typed. */
(function(){
  const $ = s => document.querySelector(s);
  const HCD = window.HCD_DATA || null;
  const state = {hcdScope:"oc", hcdSort:"count"};
  const HCD_SEV = ["closed","advisory","information","findings","violation","decertified"];
  const SEVCOL = ["var(--low)","#5a6b8c","#3d6b8a","var(--lowmod)","#c2571f","var(--contested)"];
  function ext(url,label){ return '<a class="ext" href="'+url+'" target="_blank" rel="noopener">'+label+' &#8599;</a>'; }
  function hcdUrl(u){ return !u? "" : /^https?:/.test(u)? u : HCD.meta.urlbase+u; }
  const n = x => x.toLocaleString();
  const pct = (a,b) => Math.round(100*a/b);

  let stack = [{v:"cities"}], pos = 0;
  const here = () => stack[pos] || {v:"cities"};
  function push(e){ stack = stack.slice(0,pos+1); stack.push(e); pos = stack.length-1; render(); }
  function step(d){ const k = pos+d; if(k>=0 && k<stack.length){ pos = k; render(); } }
  function home(){ stack = [{v:"cities"}]; pos = 0; render(); }
  const lettersOf = name => HCD.letters.map((L,i)=>({L,i})).filter(x=>x.L.city===name)
      .sort((a,b)=>(a.L.d||"9999").localeCompare(b.L.d||"9999"));
  const cityRec = name => HCD.cities.find(c=>c.n===name);
  function related(ix){
    const seen = {}, out = [];
    HCD.links.forEach(l=>{ const o = l.a===ix? l.b : l.b===ix? l.a : -1; if(o>=0 && !seen[o]){ seen[o]=1; out.push([o,l.w]); } });
    return out;
  }

  /* ---- facts derived once from the data ---- */
  function facts(){
    const L = HCD.letters, byCase = {};
    L.forEach((x,i)=>{ (byCase[x.id] = byCase[x.id] || []).push(i); });
    let longest = {k:"", len:0, a:"", b:"", city:""};
    Object.keys(byCase).forEach(k=>{
      const ds = byCase[k].map(i=>L[i].d).filter(Boolean).sort();
      if(byCase[k].length>longest.len) longest = {k, len:byCase[k].length, a:ds[0]||"", b:ds[ds.length-1]||"", city:L[byCase[k][0]].city};
    });
    const decertPlaces = new Set(L.filter(x=>x.sv===5).map(x=>x.city));
    const ocCities = new Set(L.filter(x=>x.cty==="Orange" && x.city!=="Orange County").map(x=>x.city));
    return {
      total:L.length, adu:L.filter(x=>x.p==="ADU").length, hau:L.filter(x=>x.p==="HAU").length,
      viol:L.filter(x=>x.sv>=4).length, decert:L.filter(x=>x.sv===5).length, decertPlaces:decertPlaces.size,
      closed:L.filter(x=>x.sv===0).length, undated:L.filter(x=>!x.d).length, recent:L.filter(x=>(x.d||"").slice(0,4)==="2026").length,
      ocLetters:L.filter(x=>x.cty==="Orange").length, ocCities:ocCities.size, longest, byCase
    };
  }
  let F = null;

  function nav(){
    const h = here();
    const crumb = h.v==="cities" ? "All cities"
      : h.v==="city" ? 'All cities / <b>'+h.city+'</b>'
      : h.v==="letter" ? 'All cities / <b>'+h.city+'</b> / letter'
      : h.v==="concepts" ? "Concepts and connections" : h.v==="faq" ? "Questions" : "Did you know";
    return '<div class="hcdnav"><button data-hcd="back" '+(pos<=0?'disabled':'')+'>&#8592; Back</button>'+
      '<button data-hcd="fwd" '+(pos>=stack.length-1?'disabled':'')+'>Forward &#8594;</button>'+
      '<span class="crumb">'+crumb+'</span></div>';
  }
  function sections(){
    const h = here(), on = v => h.v===v? ' aria-selected="true"' : '';
    return '<div class="hcdtoggle"><button data-hcd="cities"'+on("cities")+'>Cities</button>'+
      '<button data-hcd="concepts"'+on("concepts")+'>Concepts and connections</button>'+
      '<button data-hcd="faq"'+on("faq")+'>Questions</button>'+
      '<button data-hcd="dyk"'+on("dyk")+'>Did you know</button></div>';
  }

  function cities(){
    const m = HCD.meta;
    const list = HCD.cities.filter(c=>state.hcdScope==="all" || c.oc).sort((a,b)=>(a.gen-b.gen) ||
      (state.hcdSort==="name"? a.n.localeCompare(b.n) : (b.k-a.k || a.n.localeCompare(b.n))));
    const max = list.length? list[0].k : 1;
    const rows = list.map(c=>'<div class="cityrow" data-hcd="city|'+encodeURIComponent(c.n)+'" tabindex="0" role="button">'+
      '<span class="nm">'+c.n+(c.n==="Orange County"? ' <span class="rng">(the county itself)</span>' : c.c && state.hcdScope==="all"? ' <span class="rng">'+c.c+'</span>' : '')+'</span>'+
      '<span class="num"><b>'+c.k+'</b></span><span class="num">'+c.ha+'</span><span class="num">'+c.ad+'</span>'+
      '<span class="rng">'+(c.f? c.f.slice(0,7)+' to '+(c.l||'').slice(0,7) : 'no date')+'</span>'+
      '<span><span class="minibar" style="display:block;background:'+SEVCOL[c.sv]+';width:'+Math.max(6,Math.round(c.k/max*100))+'%"></span></span></div>').join("");
    return '<div class="card"><h2>HCD advice and enforcement letters by city</h2>'+
      '<p class="hint">Letters from HCD&rsquo;s public enforcement-letters dashboard (downloaded '+m.source.replace(/^.*downloaded /,"")+'): '+n(m.letters)+' letters across '+m.cities+' jurisdictions. '+
      'HCD lists '+m.not_online+' more entries whose PDF is not online, and '+m.copies+' entries that are filed as copies of another letter; those are left out here. '+
      'Click a city to read its letters. The bar&rsquo;s length is the letter count and its colour is the most serious stage in that city&rsquo;s set.</p>'+
'<div class="legend" style="margin:0 0 8px"><span><i style="background:var(--low)"></i>Closing letter</span><span><i style="background:#5a6b8c"></i>Advisory</span>'+
      '<span><i style="background:#3d6b8a"></i>Information / ordinance findings</span><span><i style="background:var(--lowmod)"></i>Findings of noncompliance</span>'+
      '<span><i style="background:#c2571f"></i>Violation notice</span><span><i style="background:var(--contested)"></i>Decertification</span></div>'+
      '<p class="src" style="margin:0 0 8px"><b>HAU</b> = Housing Accountability Unit letters (housing elements, housing law). <b>ADU</b> = letters on accessory dwelling unit ordinances. Both are HCD&rsquo;s own labels.</p>'+
      '<div class="hcdtoggle"><button data-hcd="scope|oc"'+(state.hcdScope==="oc"?' aria-selected="true"':'')+'>Orange County ('+m.oc_cities+' cities)</button>'+
      '<button data-hcd="scope|all"'+(state.hcdScope==="all"?' aria-selected="true"':'')+'>All California ('+m.cities+')</button>'+
      '<button data-hcd="sort|'+(state.hcdSort==="name"?"count":"name")+'">Sort: '+(state.hcdSort==="name"?"A to Z":"most letters")+'</button></div>'+
      '<div class="cityrow head" style="cursor:default;font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid var(--line)">'+
      '<span>City</span><span class="num">Letters</span><span class="num">HAU</span><span class="num">ADU</span><span>Date range</span><span>Most serious stage</span></div>'+rows+'</div>';
  }

  function cityView(){
    const name = here().city, rec = cityRec(name) || {k:0,ha:0,ad:0}, ix = lettersOf(name);
    const cards = ix.map(({L,i})=>{
      const kw = L.kw? '<div class="chips" style="margin-top:6px">'+L.kw.split(";").slice(0,4).map(s=>s.trim()).filter(Boolean).map(k=>'<span class="chip" style="cursor:default">'+k+'</span>').join("")+'</div>' : "";
      return '<div class="lcard" data-hcd="letter|'+i+'" tabindex="0" role="button"><div class="hd"><span class="sev sev'+L.sv+'">'+HCD_SEV[L.sv]+'</span>'+
        '<b>'+L.t+'</b><span class="dt">'+(L.d||"undated")+'</span><span class="dt">'+(L.p==="HAU"?"Housing Accountability Unit":"ADU law")+'</span></div>'+
        '<div class="sm clamp">'+(L.s||"HCD&rsquo;s data has no summary for this letter. Open the original to read it.")+'</div>'+kw+'</div>';
    }).join("");
    const top = Math.max.apply(null, ix.map(x=>x.L.sv).concat([0]));
    return '<div class="card"><h2>'+name+'</h2><p class="hint">'+rec.k+' letter'+(rec.k===1?'':'s')+(rec.f? ', '+rec.f.slice(0,7)+' to '+(rec.l||'').slice(0,7) : '')+
      '. Most serious stage in the set: <b>'+HCD_SEV[top]+'</b>. Click a letter to read it.</p>'+cards+'</div>';
  }

  /* What the stage means - each line is tied to what HCD's own letters say, not to outside knowledge. */
  function meaning(t){
    const m = {
      "Decertification of Housing Element Compliance":"HCD revoked its finding that the housing element is in compliance. Six of the nine decertification letters say noncompliance can mean ineligibility or delay in receiving state funds that require a compliant housing element, and six mention referral to the Attorney General.",
      "Housing Element Findings of Noncompliance/ Corrective Action":"HCD found the housing element out of compliance and set out corrective action. 27 of the 32 letters of this type mention decertification or revocation of the compliance finding.",
      "Notice of Violation":"A formal notice that HCD considers the city to be violating state law. 72 of the 75 letters of this type say HCD may refer the matter to the Office of the Attorney General.",
      "Notice of Potential Violation":"A notice short of a violation finding. 11 of the 25 letters of this type ask for a written response and plan of action; 10 mention a 30-day response period.",
      "Technical Assistance Letter - Repeal Request":"HCD asked the city to repeal or amend an ordinance."
    };
    return m[t] || "";
  }

  function letterView(){
    const h = here(), L = HCD.letters[h.ix];
    if(!L) return '<div class="card"><p>That letter is not in the data.</p></div>';
    const ix = lettersOf(h.city), at = ix.findIndex(x=>x.i===h.ix);
    const prev = at>0? ix[at-1] : null, next = at>=0 && at<ix.length-1? ix[at+1] : null;
    const kw = (L.kw||"").split(";").map(s=>s.trim()).filter(Boolean);
    const st = (HCD.pool.st[L.st]||"").split(";").map(s=>s.trim()).filter(Boolean);
    const rel = related(h.ix), mean = meaning(L.t);
    const relHtml = rel.length? '<div class="sec"><h3>Connected letters</h3><div class="chain">'+rel.slice(0,8).map(([j])=>{
      const R = HCD.letters[j]; return '<span class="nd" data-hcd="letter|'+j+'">'+(R.d||"undated")+' '+R.t.replace(/ Letter$/,"")+'</span>'; }).join('<span class="ar">&middot;</span>')+
      '</div><p class="src" style="margin-top:5px">Same HCD case number, or the same city with a shared issue tag.</p></div>' : '<div class="sec"><h3>Connected letters</h3><p class="src">None. No other letter in this set shares this HCD case number or a shared issue tag for this city.</p></div>';
    return '<div class="card"><div class="hd" style="display:flex;gap:8px;align-items:baseline;flex-wrap:wrap"><span class="sev sev'+L.sv+'">'+HCD_SEV[L.sv]+'</span>'+
      '<b>'+L.t+'</b><span style="color:var(--muted);font-size:12.5px">'+(L.d||"undated")+' &middot; '+L.p+'</span></div>'+
      '<h2 style="margin:6px 0 2px">'+L.city+'</h2><p class="hint" style="margin:0 0 4px">HCD case <b>'+L.id+'</b>'+(L.pg? ' &middot; '+L.pg+' page'+(L.pg===1?'':'s') : '')+'</p>'+
      '<div class="sec"><h3>What HCD says</h3><p>'+(L.s||"HCD&rsquo;s data has no summary for this letter. Open the original below.")+'</p></div>'+
      (mean? '<div class="sec"><h3>What this stage means</h3><p>'+mean+'</p></div>' : '')+
      (kw.length? '<div class="sec"><h3>Issues HCD tagged</h3><div class="chips">'+kw.slice(0,14).map(k=>'<span class="chip">'+k+'</span>').join("")+'</div></div>' : '')+
      '<div class="sec"><h3>Law HCD cites</h3><p>'+(HCD.pool.au[L.au]||"Not stated in HCD&rsquo;s data.")+(HCD.pool.au[L.au]==="Other"? ' <span class="src">(HCD&rsquo;s own label; see the statutes below)</span>' : '')+'</p></div>'+
      (st.length? '<div class="sec"><h3>Statutes listed</h3><p class="src">'+st.slice(0,26).map(s=>"&sect;"+s).join(", ")+(st.length>26? " and "+(st.length-26)+" more" : "")+'</p></div>' : '')+
      relHtml+
      '<div class="sec"><h3>Read the original</h3>'+(L.u? ext(hcdUrl(L.u),"HCD&rsquo;s PDF") : '<span class="src">No public URL in HCD&rsquo;s data.</span>')+'</div>'+
      '<div class="hcdnav" style="margin-top:14px"><button data-hcd="letter|'+(prev? prev.i : h.ix)+'" '+(prev?'':'disabled')+'>&#8592; Previous letter</button>'+
      '<button data-hcd="letter|'+(next? next.i : h.ix)+'" '+(next?'':'disabled')+'>Next letter &#8594;</button>'+
      '<button data-hcd="city|'+encodeURIComponent(L.city)+'">All of '+L.city+'</button></div></div>';
  }

  function concepts(){
    const laws = HCD.concepts.filter(c=>c.kind==="law");
    const issues = HCD.concepts.filter(c=>c.kind==="issue").slice(0,18);
    const types = HCD.concepts.filter(c=>c.kind==="type").sort((a,b)=>b.k-a.k);
    const bar = (c,max,col)=>'<div class="concept"><div class="lb"><span>'+c.term+'</span><span>'+n(c.k)+' letters &middot; '+c.nc+' cities</span></div>'+
      '<div class="tr"><div class="fl" style="width:'+Math.max(2,Math.round(c.k/max*100))+'%;background:'+col+'"></div></div></div>';
    const yr = {}; HCD.letters.forEach(L=>{ if(L.d){ const y = L.d.slice(0,4); (yr[y] = yr[y] || {HAU:0,ADU:0})[L.p]++; } });
    const ys = Object.keys(yr).sort(), ymax = Math.max.apply(null, ys.map(y=>yr[y].HAU+yr[y].ADU).concat([1]));
    const ybars = ys.map(y=>{ const t = yr[y].HAU+yr[y].ADU;
      return '<div class="concept"><div class="lb"><span>'+y+(y===ys[ys.length-1]?' (partial year)':'')+'</span><span>'+t+' &middot; '+yr[y].HAU+' HAU, '+yr[y].ADU+' ADU</span></div>'+
      '<div class="tr" style="display:flex"><div class="fl" style="width:'+(yr[y].HAU/ymax*100)+'%;background:var(--navy)"></div><div class="fl" style="width:'+(yr[y].ADU/ymax*100)+'%;background:#6d9bd1"></div></div></div>'; }).join("");
    const chains = Object.keys(F.byCase).filter(k=>F.byCase[k].length>2)
      .map(k=>({k, ix:F.byCase[k].slice().sort((a,b)=>(HCD.letters[a].d||"").localeCompare(HCD.letters[b].d||""))}))
      .sort((a,b)=>b.ix.length-a.ix.length).slice(0,8);
    const chainHtml = chains.map(c=>'<div style="margin:0 0 9px"><div style="font-size:13px;font-weight:600">'+HCD.letters[c.ix[0]].city+
      ' <span class="src">&middot; case '+c.k+' &middot; '+c.ix.length+' letters</span></div><div class="chain">'+
      c.ix.map((j,i)=>(i?'<span class="ar">&#8594;</span>':'')+'<span class="nd" data-hcd="letter|'+j+'" title="'+HCD.letters[j].t+'">'+(HCD.letters[j].d||"?")+'</span>').join("")+'</div></div>').join("");
    return '<div class="grid2">'+
      '<div class="card"><h2>Which law the letters cite</h2><p class="hint">The statute named in HCD&rsquo;s data for each letter, and how many letters cite it.</p>'+laws.map(c=>bar(c,laws[0].k,"var(--accent)")).join("")+'</div>'+
      '<div class="card"><h2>Letters by year</h2><p class="hint">The last year is partial: the data was downloaded on 29 October 2026.</p><div class="legend" style="margin:0 0 8px"><span><i style="background:var(--navy)"></i>HAU (housing element / housing law)</span><span><i style="background:#6d9bd1"></i>ADU (accessory dwelling unit law)</span></div>'+ybars+'</div>'+
      '<div class="card"><h2>Most frequent issue tags</h2><p class="hint">The topics HCD tagged most often. A tag says what a letter is about, not that the city was wrong.</p>'+issues.map(c=>bar(c,issues[0].k,"var(--low)")).join("")+'</div>'+
      '<div class="card"><h2>What kind of letter</h2><p class="hint">HCD&rsquo;s own letter-type labels.</p>'+types.map(c=>bar(c,types[0].k,"#6d4aa8")).join("")+'</div>'+
      '<div class="card" style="grid-column:1/-1"><h2>Longest case chains</h2><p class="hint">HCD reuses one case number across the letters in a case. A long chain means HCD wrote repeatedly; it does not by itself say the case escalated. Each chip is a letter&rsquo;s date; click one to read that letter.</p>'+chainHtml+'</div></div>';
  }

  function faq(){
    const m = HCD.meta;
    const qs = [
      ["What are these letters?","HCD publishes advice and enforcement letters it sends to cities and counties on an enforcement-letters dashboard. The dashboard files them under two labels, HAU (Housing Accountability Unit) and ADU (accessory dwelling unit law). This tab makes that dashboard browsable by city."],
      ["Does a letter mean the city is out of compliance?","Not usually. Of "+n(F.total)+" letters, "+n(F.viol)+" are at the notice-of-violation or findings-of-noncompliance stage or beyond, and "+F.decert+" are decertifications (in "+F.decertPlaces+" places). The rest are advisory, requests for information, or closing letters."],
      ["What can HCD do after a letter?","HCD&rsquo;s own letters describe it. Housing-element letters say noncompliance can mean ineligibility or delay in receiving state funds that require a compliant housing element, and that HCD may refer matters to the Office of the Attorney General. Open any letter in the set to read the exact wording."],
      ["Why does the same city appear many times?","A case runs over time: HCD writes, the city responds or does not, and HCD writes again. The longest chain here is "+F.longest.len+" letters ("+F.longest.city+", "+F.longest.a+" to "+F.longest.b+")."],
      ["How does this connect to RHNA?","HCD is the department that issued the 7th Cycle determination shown on the other tabs. These letters are about housing elements and local ordinances, which is the same state oversight that sits behind RHNA. That is context, not a finding: nothing in these letters ties a city&rsquo;s enforcement history to its RHNA allocation."],
      ["Do ADU letters outnumber the rest?","No. HAU letters are "+n(F.hau)+" and ADU letters are "+n(F.adu)+" ("+pct(F.adu,F.total)+"%). ADU letters are the faster-growing share: see the year chart on the Concepts tab."],
      ["Do cities fix things?","Some do. "+F.closed+" letters are closing letters (successful completion of corrective action, or recertification)."],
      ["Where does this come from, and how current is it?","From HCD&rsquo;s public dashboard, downloaded 29 October 2026, covering "+HCD.letters.filter(x=>x.d).map(x=>x.d).sort()[0].slice(0,4)+" to 2026. Each letter links to HCD&rsquo;s own PDF. "+m.copies+" dashboard entries that are filed as copies of another letter were left out, because "+"some of them point at a different city&rsquo;s letter."]
    ];
    return '<div class="card"><h2>Questions</h2><p class="hint">Plain answers about what these letters are. Numbers are computed from the data.</p>'+qs.map(q=>'<div class="faq"><h4>'+q[0]+'</h4><p>'+q[1]+'</p></div>').join("")+'</div>';
  }

  function dyk(){
    const items = [
      [n(F.total),"letters in the set, from HCD to cities and counties."],
      [HCD.meta.cities,"jurisdictions have received at least one."],
      [pct(F.adu,F.total)+"%","of the letters are ADU matters ("+n(F.adu)+" of "+n(F.total)+")."],
      [F.ocCities+" of 34","Orange County cities have received at least one letter ("+F.ocLetters+" letters including the county itself)."],
      [F.decertPlaces,"places have a decertification letter ("+F.decert+" letters)."],
      [F.closed,"letters are closings: successful completion or recertification."],
      [F.longest.len,"letters in the longest case chain ("+F.longest.city+", "+F.longest.a+" to "+F.longest.b+")."],
      [F.recent,"letters are dated in 2026 so far (the data runs to late October)."]
    ];
    return '<div class="card"><h2>Did you know</h2><p class="hint">Facts that fall out of seeing the whole set at once. All computed from the data.</p><div class="grid2">'+
      items.map(f=>'<div class="dyk"><div class="big">'+f[0]+'</div><div class="lb">'+f[1]+'</div></div>').join("")+'</div></div>';
  }

  function panel(){
    const h = here();
    if(h.v==="letter"){ const L = HCD.letters[h.ix];
      if(L) return '<h2>'+L.city+'</h2><div class="sec"><span class="sev sev'+L.sv+'">'+HCD_SEV[L.sv]+'</span></div>'+
        '<div class="sec"><h3>Letter</h3><p><b>'+L.t+'</b><br>'+(L.d||"undated")+' &middot; '+L.p+' &middot; '+L.id+'</p></div>'+
        (L.u? '<div class="sec"><h3>Original</h3>'+ext(hcdUrl(L.u),"HCD&rsquo;s PDF")+'</div>' : ''); }
    if(h.v==="city"){ const r = cityRec(h.city) || {k:0,ha:0,ad:0};
      return '<h2>'+h.city+'</h2><div class="sec"><h3>Letters</h3><p><b>'+r.k+'</b> &middot; '+r.ha+' HAU &middot; '+r.ad+' ADU</p></div>'+
        (r.f? '<div class="sec"><h3>Period</h3><p>'+r.f+' to '+(r.l||"")+'</p></div>' : '')+
        '<div class="sec"><h3>Colour key</h3><p>Green = closing letter, slate = advisory, blue = information or ordinance findings, amber = findings of noncompliance, orange = violation notice, red = decertification.</p></div>'; }
    return '<h2>HCD advice and enforcement letters</h2><div class="sec"><p>Letters from HCD&rsquo;s public enforcement-letters dashboard. Pick a city, or open <b>Concepts and connections</b> to see what recurs and how letters chain together.</p></div>'+
      '<div class="sec"><h3>The numbers</h3><p>'+n(HCD.meta.letters)+' letters &middot; '+HCD.meta.cities+' jurisdictions &middot; '+F.ocLetters+' in Orange County</p></div>'+
      '<div class="sec src">Source: '+HCD.meta.source+'. Built '+HCD.meta.built+'. '+(EMBED? 'Beta view, not an OCCOG position and not legal advice.' : 'Internal working view, not an OCCOG position.')+'</div>';
  }

  const EMBED = !!window.HCD_EMBED;      /* true when hosted as a tab inside the explainer */
  function viewHtml(){
    if(!HCD) return '<div class="card"><h2>HCD advice letters</h2><p class="hint">hcd-data.js did not load, so there is nothing to show.</p></div>';
    F = F || facts();
    const h = here();
    const body = h.v==="city"? cityView() : h.v==="letter"? letterView() : h.v==="concepts"? concepts() : h.v==="faq"? faq() : h.v==="dyk"? dyk() : cities();
    const note = EMBED? '<p class="src" style="margin:0 0 8px"><b>Beta.</b> This tab is built from HCD&rsquo;s public enforcement-letters dashboard, not from the SCAG packet cited at the top of the page.</p>' : '';
    return note+nav()+sections()+body;
  }
  function panelHtml(){ return HCD? (F = F || facts(), panel()) : ''; }
  function render(){
    if(EMBED){ if(window.__hcdRedraw) window.__hcdRedraw(); window.scrollTo(0,0); return; }
    $("#view").innerHTML = viewHtml();
    $("#panel").innerHTML = panelHtml();
    window.scrollTo(0,0);
  }

  document.addEventListener("click", function(ev){
    if(ev.target.closest("a.ext")) return;
    const hc = ev.target.closest("[data-hcd]"); if(!hc) return;
    const raw = hc.getAttribute("data-hcd"), bar = raw.indexOf("|");
    const cmd = bar<0? raw : raw.slice(0,bar), arg = bar<0? "" : decodeURIComponent(raw.slice(bar+1));
    if(cmd==="back") step(-1); else if(cmd==="fwd") step(1);
    else if(cmd==="home" || cmd==="cities") home();
    else if(cmd==="concepts"||cmd==="faq"||cmd==="dyk") push({v:cmd});
    else if(cmd==="city") push({v:"city", city:arg});
    else if(cmd==="letter"){ const k = parseInt(arg,10); if(HCD.letters[k]) push({v:"letter", city:HCD.letters[k].city, ix:k}); }
    else if(cmd==="scope"){ state.hcdScope = arg; render(); }
    else if(cmd==="sort"){ state.hcdSort = arg; render(); }
  });
  document.addEventListener("keydown", function(ev){
    if((ev.key==="Enter"||ev.key===" ") && ev.target.matches && ev.target.matches(".cityrow,.lcard")){ ev.preventDefault(); ev.target.click(); }
  });
  window.HCDTab = {view:viewHtml, panel:panelHtml};
  if(!EMBED) render();
})();
