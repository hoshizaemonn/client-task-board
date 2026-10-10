/* 日次タブ 描画本体（ハイアルチ広告ダッシュボードの簡易版）
   使う側: window.DailyDash.render(el, data, ctx)
   data = build_daily_json.py の出力（daily_all / monthly / ads / alerts / pending / links）
   グラフ: Chart.js 4（vendor/）。1グラフ1軸（二軸は使わない）。媒体色は dataviz 検証済み:
     Meta=青 #2a78d6 / Yahoo=橙 #eb6834 / Amazon=緑 #1baf7a（dark: #3987e5 / #d95926 / #199e70） */
(function () {
  const CSS = `
  .dd-top{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px}
  .dd-top select,.dd-top .seg{border:1px solid var(--line);background:var(--card);border-radius:8px;font-size:13px}
  .dd-top select{padding:6px 10px}
  .dd-top .seg{display:flex;padding:3px;gap:2px}
  .dd-top .seg button{border:0;background:transparent;border-radius:6px;padding:4px 10px;font-size:13px;color:var(--muted);cursor:pointer}
  .dd-top .seg button.on{background:var(--accent);color:#fff}
  .dd-top .upd{font-size:12px;color:var(--muted);margin-left:auto}
  .dd-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-bottom:12px}
  .dd-kpi{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 12px;box-shadow:var(--shadow);display:grid;grid-template-columns:1fr auto;gap:4px 8px;align-items:end}
  .dd-kpi .l{grid-column:1/-1;font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .dd-kpi .n{font-size:21px;font-weight:700;line-height:1.1}
  .dd-kpi .delta{font-size:11px;color:var(--muted);white-space:nowrap}
  .dd-kpi .delta.up{color:var(--green)}.dd-kpi .delta.down{color:var(--red)}.dd-kpi .delta.bad-up{color:var(--red)}.dd-kpi .delta.good-down{color:var(--green)}
  .dd-kpi svg{grid-column:1/-1;width:100%;height:28px;display:block}
  .dd-charts{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:8px;margin-bottom:12px}
  .dd-card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 12px;box-shadow:var(--shadow);min-width:0}
  .dd-card h3{margin:0 0 6px;font-size:13px;color:var(--muted);font-weight:600;display:flex;gap:8px;align-items:center}
  .dd-card .legend{display:flex;gap:10px;font-size:11px;color:var(--muted);margin-left:auto}
  .dd-card .legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:4px;vertical-align:-1px}
  .dd-card canvas{width:100%!important;height:190px!important}
  .dd-media{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:8px;margin-bottom:12px}
  .dd-media .dd-card{border-top:3px solid var(--mc)}
  .dd-media dl{display:grid;grid-template-columns:auto 1fr;gap:3px 10px;margin:0;font-size:13px}
  .dd-media dt{color:var(--muted)}.dd-media dd{margin:0;text-align:right;font-variant-numeric:tabular-nums}
  .dd-media .big{font-size:20px;font-weight:700;margin:2px 0 6px}
  .dd-tbl{overflow-x:auto;background:var(--card);border:1px solid var(--line);border-radius:10px;margin-bottom:12px}
  .dd-tbl table{border-collapse:collapse;width:100%;font-size:12px;white-space:nowrap}
  .dd-tbl th,.dd-tbl td{padding:6px 8px;border-bottom:1px solid var(--line);text-align:right;font-variant-numeric:tabular-nums}
  .dd-tbl th:first-child,.dd-tbl td:first-child{text-align:left;position:sticky;left:0;background:var(--card)}
  .dd-tbl thead th{color:var(--muted);font-weight:600;background:var(--gray-soft);cursor:pointer;user-select:none}
  .dd-tbl thead th.sorted:after{content:' ▼';font-size:9px}.dd-tbl thead th.sorted.asc:after{content:' ▲'}
  .dd-tbl tr.yesterday td{background:var(--accent-soft)}
  .dd-tbl td.buy{color:var(--green);font-weight:700}.dd-tbl td.zero{color:var(--muted)}
  .dd-tbl .v-good{color:var(--green)}.dd-tbl .v-warn{color:var(--amber)}.dd-tbl .v-bad{color:var(--red)}
  .dd-bar{display:inline-block;height:8px;background:var(--series-1);border-radius:2px;vertical-align:middle;margin-right:6px}
  details.dd-more{margin-bottom:12px}details.dd-more summary{cursor:pointer;font-size:13px;color:var(--muted);padding:6px 0}
  .dd-alerts{display:flex;flex-direction:column;gap:6px;margin-bottom:12px}
  .dd-alert{border-radius:8px;padding:8px 12px;font-size:13px;border:1px solid var(--line);background:var(--card)}
  .dd-alert.red{background:var(--red-soft);color:var(--red);border-color:transparent}
  .dd-alert.yellow{background:var(--amber-soft);color:var(--amber);border-color:transparent}
  .dd-links{display:flex;flex-wrap:wrap;gap:6px;font-size:12px;margin-bottom:10px}
  .dd-links a{border:1px solid var(--line);border-radius:999px;padding:2px 10px;text-decoration:none;background:var(--card)}
  :root{--series-1:#2a78d6;--series-2:#eb6834;--series-3:#1baf7a;--series-1s:#9ec5f4}
  @media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--series-1:#3987e5;--series-2:#d95926;--series-3:#199e70;--series-1s:#1c5cab}}
  :root[data-theme="dark"]{--series-1:#3987e5;--series-2:#d95926;--series-3:#199e70;--series-1s:#1c5cab}`;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  const S = { range: '30', gran: 'day', sort: { k: 'cost', asc: false } };
  try { Object.assign(S, JSON.parse(localStorage.getItem('dd_state') || '{}')); } catch (_) {}
  const keep = () => { try { localStorage.setItem('dd_state', JSON.stringify(S)); } catch (_) {} };
  const charts = [];
  const cssv = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const yen = n => n == null ? '–' : '¥' + Math.round(n).toLocaleString('ja-JP');
  const int = n => n == null ? '–' : Math.round(n).toLocaleString('ja-JP');
  const sum = (a, k) => a.reduce((s, r) => s + (r[k] || 0), 0);
  const cpaOf = (cost, buy) => buy > 0 ? cost / buy : null;

  function pickRange(rows, today) {
    const t = new Date(today + 'T00:00:00');
    const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    if (S.range === 'thisMonth') { const f = ymd(new Date(t.getFullYear(), t.getMonth(), 1)); return rows.filter(r => r.date >= f); }
    if (S.range === 'lastMonth') { const f = ymd(new Date(t.getFullYear(), t.getMonth() - 1, 1)), e = ymd(new Date(t.getFullYear(), t.getMonth(), 0)); return rows.filter(r => r.date >= f && r.date <= e); }
    if (S.range === 'all') return rows;
    const n = Number(S.range); const f = ymd(new Date(t.getTime() - n * 86400000)); return rows.filter(r => r.date >= f);
  }
  function prevRange(rows, cur) {
    if (!cur.length) return [];
    const n = cur.length; const i = rows.findIndex(r => r.date === cur[0].date);
    return i > 0 ? rows.slice(Math.max(0, i - n), i) : [];
  }
  function group(rows) {
    if (S.gran === 'day') return rows.map(r => ({ label: r.date.slice(5).replace('-', '/'), rows: [r] }));
    const m = new Map();
    for (const r of rows) {
      let k;
      if (S.gran === 'month') k = r.date.slice(0, 7);
      else { const d = new Date(r.date + 'T00:00:00'); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); k = d.toISOString().slice(0, 10); }
      if (!m.has(k)) m.set(k, []); m.get(k).push(r);
    }
    return [...m.entries()].map(([k, rs]) => ({ label: S.gran === 'month' ? k.replace('-', '/') : k.slice(5).replace('-', '/') + '週', rows: rs }));
  }
  function agg(rs) {
    const cost = sum(rs, 'ad_cost'), buy = sum(rs, 'purchase');
    return { cost, buy, meta: sum(rs, 'meta_cost'), yahoo: sum(rs, 'yahoo_cost'), amazon: sum(rs, 'amazon_purchase'),
      daibiki: sum(rs, 'daibiki'), colorme: sum(rs, 'colorme'), mclk: sum(rs, 'meta_clicks'), yclk: sum(rs, 'yahoo_clicks'),
      mimp: sum(rs, 'meta_imp'), mattr: sum(rs, 'meta_purchase_attr'), ycv: sum(rs, 'yahoo_cv'), cpa: cpaOf(cost, buy) };
  }
  function delta(cur, prev, lowerIsBetter) {
    if (prev == null || cur == null || !prev) return { txt: '前期 –', cls: '' };
    const p = (cur - prev) / prev * 100; const up = p >= 0;
    const cls = lowerIsBetter ? (up ? 'bad-up' : 'good-down') : (up ? 'up' : 'down');
    return { txt: (up ? '▲' : '▼') + Math.abs(p).toFixed(0) + '% 前期比', cls };
  }
  function spark(vals, color) {
    const v = vals.map(x => x || 0); if (v.length < 2) return '';
    const mx = Math.max(...v, 1), w = 100, h = 28;
    const pts = v.map((x, i) => `${(i / (v.length - 1) * w).toFixed(1)},${(h - 2 - x / mx * (h - 6)).toFixed(1)}`).join(' ');
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polyline fill="none" stroke="${color}" stroke-width="1.5" points="${pts}"/></svg>`;
  }

  function render(el, d, ctx) {
    const { esc, fmtDate } = ctx;
    charts.splice(0).forEach(c => c.destroy());
    const all = d.daily_all || d.daily || [];
    const cur = pickRange(all, ctx.todayStr());
    const prev = prevRange(all, cur);
    const A = agg(cur), P = agg(prev);
    const g = group(cur);
    const c1 = cssv('--series-1'), c2 = cssv('--series-2'), c3 = cssv('--series-3'), c1s = cssv('--series-1s');
    const last = all[all.length - 1] || {}; const ga = last.ga4 || {};
    const rangeLabel = { '7': '7日', '14': '14日', '30': '30日', '90': '90日', thisMonth: '今月', lastMonth: '先月', all: '全期間' };

    const top = `<div class="dd-top">
      <select id="ddClient">${ctx.clients.map(c => `<option value="${c.id}" ${c.id === ctx.current ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
      <div class="seg" id="ddRange">${Object.entries(rangeLabel).map(([k, v]) => `<button data-r="${k}" class="${S.range === k ? 'on' : ''}">${v}</button>`).join('')}</div>
      <div class="seg" id="ddGran">${[['day', '日次'], ['week', '週次'], ['month', '月次']].map(([k, v]) => `<button data-g="${k}" class="${S.gran === k ? 'on' : ''}">${v}</button>`).join('')}</div>
      <span class="upd">最新 <b>${esc(d.latest_date || '–')}</b>${d.latest_date === d.yesterday ? '（昨日分あり）' : ' <span style="color:var(--red)">（昨日分なし）</span>'} ／ 期間 ${cur.length ? esc(cur[0].date.slice(5)) + '〜' + esc(cur[cur.length - 1].date.slice(5)) : '–'}（${cur.length}日）</span>
    </div>`;
    const alerts = `<div class="dd-alerts">${(d.alerts || []).map(a => `<div class="dd-alert ${a.level}">${a.level === 'red' ? '🔴' : '🟡'} ${esc(a.text)}</div>`).join('') || '<div class="dd-alert">🟢 アラートなし</div>'}</div>`;

    const sp14 = all.slice(-14);
    const kpi = (l, n, dl, vals, color) => { const dd = dl || { txt: '', cls: '' }; return `<div class="dd-kpi"><div class="l">${l}</div><div class="n">${n}</div><div class="delta ${dd.cls}">${dd.txt}</div>${spark(vals, color)}</div>`; };
    const kpis = `<div class="dd-kpis">
      ${kpi('広告費合計（' + cur.length + '日）', yen(A.cost), delta(A.cost, P.cost, true), sp14.map(r => r.ad_cost), cssv('--text'))}
      ${kpi('実購入', int(A.buy), delta(A.buy, P.buy, false), sp14.map(r => r.purchase), cssv('--green'))}
      ${kpi('CPA（実購入）', A.cpa ? yen(A.cpa) : '–', delta(A.cpa, P.cpa, true), sp14.map(r => r.purchase > 0 ? r.cpa : 0), cssv('--amber'))}
      ${kpi('Meta 広告費', yen(A.meta), delta(A.meta, P.meta, true), sp14.map(r => r.meta_cost), c1)}
      ${kpi('Yahoo 広告費', yen(A.yahoo), delta(A.yahoo, P.yahoo, true), sp14.map(r => r.yahoo_cost), c2)}
      ${kpi('Amazon 購入', int(A.amazon), delta(A.amazon, P.amazon, false), sp14.map(r => r.amazon_purchase), c3)}
    </div>`;

    const chartCard = (id, title, legend) => `<div class="dd-card"><h3>${title}<span class="legend">${legend}</span></h3><canvas id="${id}"></canvas></div>`;
    const lg = (c, t) => `<span><i style="background:${c}"></i>${t}</span>`;
    const chartsHtml = `<div class="dd-charts">
      ${chartCard('ddC1', '広告費（媒体別）', lg(c1, 'Meta') + lg(c2, 'Yahoo'))}
      ${chartCard('ddC2', '実購入（経路別）', lg(c1s, '代引き') + lg(c1, 'カラーミー') + lg(c3, 'Amazon'))}
      ${chartCard('ddC3', 'CPA（実購入ベース）', '')}
    </div>`;

    const mcard = (name, color, big, rows) => `<div class="dd-card" style="--mc:${color}"><h3>${name}</h3><div class="big">${big}</div><dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl></div>`;
    const media = `<div class="dd-media">
      ${mcard('Meta', c1, yen(A.meta), [['クリック', int(A.mclk)], ['CPC', A.mclk ? yen(A.meta / A.mclk) : '–'], ['IMP', int(A.mimp)], ['帰属購入（画面）', int(A.mattr)], ['GA4 直近セッション', int(ga['Meta セッション'])], ['GA4 直帰率', ga['Meta 直帰率%'] != null ? ga['Meta 直帰率%'] + '%' : '–']])}
      ${mcard('Yahoo', c2, yen(A.yahoo), [['クリック', int(A.yclk)], ['CPC', A.yclk ? yen(A.yahoo / A.yclk) : '–'], ['CV（媒体計上）', int(A.ycv)], ['GA4 直近セッション', int(ga['Yahoo セッション'])], ['GA4 直帰率', ga['Yahoo 直帰率%'] != null ? ga['Yahoo 直帰率%'] + '%' : '–']])}
      ${mcard('Amazon', c3, int(A.amazon) + ' 件', [['購入（スプシ手入力）', int(A.amazon)], ['広告費・ROAS', '未連携（API申請待ち）'], ['直近セール', (d.amazon_sale || []).length ? esc((d.amazon_sale.slice(-1)[0]['日付'] || '')) : '–']])}
    </div>`;

    const ads = (d.ads && d.ads.rows) || [];
    const k = S.sort.k; const asc = S.sort.asc;
    const sorted = ads.slice().sort((a, b) => { const x = a[k], y = b[k]; if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1; return typeof x === 'string' ? (asc ? x.localeCompare(y) : y.localeCompare(x)) : (asc ? x - y : y - x); });
    const maxCost = Math.max(...ads.map(a => a.cost || 0), 1);
    const vcls = v => /✅/.test(v) ? 'v-good' : /🔴|❌/.test(v) ? 'v-bad' : /🟡|⚠/.test(v) ? 'v-warn' : '';
    const cols = [['name', '広告名'], ['verdict', '判定'], ['cost', '費用'], ['imp', 'IMP'], ['clicks', 'クリック'], ['cpc', 'CPC'], ['purchase', 'Meta計上購入'], ['cpa', 'Meta基準CPA']];
    const adsTbl = `<div class="dd-card" style="padding-bottom:4px;margin-bottom:12px"><h3>Meta 広告別（${esc((d.ads && d.ads.period || '').replace(/📋 広告別パフォーマンス（|）/g, ''))}）<span class="legend">購入・CPAはMeta計上値。実購入はカラーミー/代引き/Yahoo側</span></h3>
      <div class="dd-tbl" style="border:0;margin:0"><table><thead><tr>${cols.map(([ck, l]) => `<th data-k="${ck}" class="${k === ck ? 'sorted' + (asc ? ' asc' : '') : ''}">${l}</th>`).join('')}</tr></thead><tbody>${
        sorted.map(a => `<tr><td>${esc(a.name)}</td><td class="${vcls(a.verdict)}" style="text-align:left">${esc(a.verdict)}</td><td>${a.cost > 0 ? `<span class="dd-bar" style="width:${Math.round(a.cost / maxCost * 60)}px"></span>${yen(a.cost)}` : '–'}</td><td>${a.imp > 0 ? int(a.imp) : '–'}</td><td>${a.clicks > 0 ? int(a.clicks) : '–'}</td><td>${a.clicks > 0 ? yen(a.cpc) : '–'}</td><td class="${a.purchase > 0 ? 'buy' : 'zero'}">${int(a.purchase)}</td><td>${a.purchase > 0 ? yen(a.cpa) : '–'}</td></tr>`).join('')}</tbody></table></div></div>`;

    const dcols = [['date', '日付'], ['purchase', '購入'], ['ad_cost', '広告費'], ['cpa', 'CPA'], ['meta_cost', 'Meta費'], ['meta_clicks', 'Metaクリック'], ['meta_cpc', 'MetaCPC'], ['meta_purchase_attr', 'Meta帰属'], ['yahoo_cost', 'Yahoo費'], ['yahoo_clicks', 'Yahooクリック'], ['yahoo_cpc', 'YahooCPC'], ['amazon_purchase', 'Amazon購入']];
    const dailyTbl = `<details class="dd-more"><summary>日別の明細（${cur.length}日）を開く</summary><div class="dd-tbl"><table><thead><tr>${dcols.map(c => `<th>${c[1]}</th>`).join('')}</tr></thead><tbody>${
      cur.slice().reverse().map(r => `<tr class="${r.date === d.yesterday ? 'yesterday' : ''}">${dcols.map(([ck]) => {
        if (ck === 'date') return `<td>${fmtDate(r.date)}</td>`;
        if (ck === 'cpa') return `<td>${r.purchase > 0 && r.cpa > 0 ? yen(r.cpa) : '–'}</td>`;
        const v = r[ck]; const money = /cost|cpc/.test(ck); const cls = (ck === 'purchase' || ck === 'amazon_purchase') && v > 0 ? 'buy' : (v === 0 ? 'zero' : '');
        return `<td class="${cls}">${money ? yen(v) : int(v)}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div></details>`;
    const mon = `<details class="dd-more"><summary>月次サマリー</summary><div class="dd-tbl"><table><thead><tr><th>月</th><th>購入</th><th>Meta費</th><th>Yahoo費</th><th>広告費</th><th>CPA</th></tr></thead><tbody>${
      (d.monthly || []).slice().reverse().map(m => `<tr><td>${esc(m.month)}</td><td class="${m.purchase > 0 ? 'buy' : ''}">${int(m.purchase)}</td><td>${yen(m.meta_cost)}</td><td>${yen(m.yahoo_cost)}</td><td>${yen(m.ad_cost)}</td><td>${m.purchase > 0 ? yen(m.cpa) : '–'}</td></tr>`).join('')}</tbody></table></div></details>`;
    const links = `<div class="dd-links">${Object.entries(d.links || {}).map(([kk, v]) => `<a href="${esc(v)}" target="_blank" rel="noopener">${esc(kk)} ↗</a>`).join('')}</div>`;
    const src = `<div class="foot" style="margin-top:4px">取得元: ${Object.values(d.sources || {}).map(esc).join(' ／ ')}</div>`;

    el.innerHTML = top + alerts + kpis + chartsHtml + media + adsTbl + dailyTbl + mon + links + src;

    // ---- charts（1グラフ1軸）
    if (window.Chart && g.length) {
      const labels = g.map(x => x.label);
      const text = cssv('--muted'), grid = cssv('--line');
      const base = { responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false }, tooltip: { callbacks: {} } },
        scales: { x: { grid: { display: false }, ticks: { color: text, maxTicksLimit: 10, maxRotation: 0 } }, y: { grid: { color: grid }, ticks: { color: text, maxTicksLimit: 5 }, border: { display: false } } } };
      const mk = (id, cfg) => charts.push(new Chart(document.getElementById(id), cfg));
      const money = v => '¥' + Math.round(v).toLocaleString('ja-JP');
      mk('ddC1', { type: 'bar', data: { labels, datasets: [
          { label: 'Meta', data: g.map(x => sum(x.rows, 'meta_cost')), backgroundColor: c1, stack: 's', borderRadius: 3, borderSkipped: false, borderWidth: { top: 2 }, borderColor: cssv('--card') },
          { label: 'Yahoo', data: g.map(x => sum(x.rows, 'yahoo_cost')), backgroundColor: c2, stack: 's', borderRadius: 3, borderWidth: { top: 2 }, borderColor: cssv('--card') }] },
        options: { ...base, scales: { ...base.scales, x: { ...base.scales.x, stacked: true }, y: { ...base.scales.y, stacked: true, ticks: { ...base.scales.y.ticks, callback: money } } },
          plugins: { ...base.plugins, tooltip: { callbacks: { label: c => ` ${c.dataset.label} ${money(c.parsed.y)}` } } } } });
      mk('ddC2', { type: 'bar', data: { labels, datasets: [
          { label: '代引き', data: g.map(x => sum(x.rows, 'daibiki')), backgroundColor: c1s, stack: 's', borderWidth: { top: 2 }, borderColor: cssv('--card') },
          { label: 'カラーミー', data: g.map(x => sum(x.rows, 'colorme')), backgroundColor: c1, stack: 's', borderWidth: { top: 2 }, borderColor: cssv('--card') },
          { label: 'Amazon', data: g.map(x => sum(x.rows, 'amazon_purchase')), backgroundColor: c3, stack: 's', borderRadius: 3, borderWidth: { top: 2 }, borderColor: cssv('--card') }] },
        options: { ...base, scales: { ...base.scales, x: { ...base.scales.x, stacked: true }, y: { ...base.scales.y, stacked: true, ticks: { ...base.scales.y.ticks, precision: 0 } } },
          plugins: { ...base.plugins, tooltip: { callbacks: { label: c => ` ${c.dataset.label} ${c.parsed.y}件` } } } } });
      mk('ddC3', { type: 'line', data: { labels, datasets: [{ label: 'CPA', data: g.map(x => { const a = agg(x.rows); return a.cpa; }), borderColor: cssv('--amber'), backgroundColor: cssv('--amber'), borderWidth: 2, pointRadius: 4, pointHoverRadius: 6, spanGaps: false, tension: 0 }] },
        options: { ...base, scales: { ...base.scales, y: { ...base.scales.y, ticks: { ...base.scales.y.ticks, callback: money } } },
          plugins: { ...base.plugins, tooltip: { callbacks: { label: c => c.parsed.y == null ? ' 購入なし' : ` CPA ${money(c.parsed.y)}` } } } } });
    }

    // ---- events
    el.querySelector('#ddClient').addEventListener('change', e => ctx.onClient(e.target.value));
    el.querySelector('#ddRange').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.range = b.dataset.r; keep(); render(el, d, ctx); });
    el.querySelector('#ddGran').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.gran = b.dataset.g; keep(); render(el, d, ctx); });
    el.querySelectorAll('.dd-tbl thead th[data-k]').forEach(th => th.addEventListener('click', () => { const kk = th.dataset.k; S.sort = { k: kk, asc: S.sort.k === kk ? !S.sort.asc : kk === 'name' }; keep(); render(el, d, ctx); }));
  }

  window.DailyDash = { render };
})();
