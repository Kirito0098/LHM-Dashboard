// ===== DOM (время/дата) =====
const hhEl = document.getElementById('hh');
const mmEl = document.getElementById('mm');
const ssEl = document.getElementById('ss');
const dowEl = document.getElementById('dow');
const dayEl = document.getElementById('day');
const monEl = document.getElementById('mon');
const yearEl = document.getElementById('year');
const dayProgressBar = document.getElementById('dayProgress');
const dayProgressText = document.getElementById('dayProgressText');

// Календарь
const calTitle = document.getElementById('calTitle');
const calDays  = document.getElementById('calDays');
const todayNote= document.getElementById('todayNote');

// ===== DOM (погода) =====
const wTemp  = document.getElementById('wTemp');
const wDesc  = document.getElementById('wDesc');
const wFeels = document.getElementById('wFeels');
const wMinMax= document.getElementById('wMinMax');
const wWind  = document.getElementById('wWind');
const wForecast = document.getElementById('wForecast');

// ===== DOM (метрики и заголовки) =====
const themeToggle = document.getElementById('theme-toggle');
const hud = document.getElementById('hud');

const cpuNameEl = document.getElementById('cpuName');
const gpuNameEl = document.getElementById('gpuName');
const ramNameEl = document.getElementById('ramName');

const cpuLoadVal = document.getElementById('cpuLoadVal');
const cpuTempVal = document.getElementById('cpuTempVal');
const cpuClockVal = document.getElementById('cpuClockVal');
const cpuPowerVal = document.getElementById('cpuPowerVal');
const cpuFanVal   = document.getElementById('cpuFanVal');
const cpuLoadBar  = document.getElementById('cpuLoadBar');
const cpuTempBar  = document.getElementById('cpuTempBar');

const gpuLoadVal = document.getElementById('gpuLoadVal');
const gpuTempVal = document.getElementById('gpuTempVal');
const gpuClockVal= document.getElementById('gpuClockVal');
const gpuFanVal  = document.getElementById('gpuFanVal');
const vramVal    = document.getElementById('vramVal');
const gpuLoadBar = document.getElementById('gpuLoadBar');
const gpuTempBar = document.getElementById('gpuTempBar');
const vramBar    = document.getElementById('vramBar');

const ramVal     = document.getElementById('ramVal');
const ramTextVal = document.getElementById('ramTextVal');
const ramBar     = document.getElementById('ramBar');

/* ---------- Утилиты безопасности ---------- */
function ensureNodes(...nodes){
  return nodes.every(n => !!n);
}
function safeText(el, text){
  if (el) el.textContent = text;
}

/* ---------- Время/дата (электронные часы) ---------- */
function renderTime(){
  const now = new Date();
  const hh = now.getHours(), mm = now.getMinutes(), ss = now.getSeconds();

  safeText(hhEl, String(hh).padStart(2,'0'));
  safeText(mmEl, String(mm).padStart(2,'0'));
  safeText(ssEl, String(ss).padStart(2,'0'));

  safeText(dowEl, now.toLocaleString('ru', { weekday: 'long' }));
  safeText(dayEl, String(now.getDate()).padStart(2,'0'));
  safeText(monEl, String(now.getMonth()+1).padStart(2,'0'));
  safeText(yearEl, String(now.getFullYear()));

  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const pct = ((now - start)/86400000*100);
  if (dayProgressBar) dayProgressBar.style.width = pct.toFixed(2) + '%';
  safeText(dayProgressText, pct.toFixed(2) + '%');

  // если наступил новый день — перерисуем календарь
  const todayKey = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;
  if (renderTime._dayKey !== todayKey){
    try {
      renderCalendar(now);
      renderTime._dayKey = todayKey;
    } catch (e){
      console.error('[Calendar] render error:', e);
    }
  }
}

// первичный рендер и обновление ~4 раза в секунду
renderTime();
setInterval(renderTime, 250);

/* ---------- Календарь (ПН—ВС, подсветка «сегодня») ---------- */
const MONTHS_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

function mondayIndex(jsDay){ // 0..6 (ПН=0, ..., ВС=6)
  if (typeof jsDay !== 'number' || Number.isNaN(jsDay)) return 0;
  return (jsDay + 6) % 7; // JS: 0=ВС -> 6; 1=ПН -> 0
}
function daysInMonth(y,m){ // m: 0..11
  return new Date(y, m+1, 0).getDate();
}

function renderCalendar(baseDate = new Date()){
  // Если DOM календаря отсутствует — выходим
  if (!ensureNodes(calTitle, calDays, todayNote)) {
    console.warn('[Calendar] DOM nodes not found (calTitle/calDays/todayNote). Skipping calendar render.');
    return;
  }

  const y = baseDate.getFullYear();
  const m = baseDate.getMonth();
  const d = baseDate.getDate();

  calTitle.textContent = `${MONTHS_RU[m]} ${y}`;

  // сетка 6x7 с понедельника
  const firstOfMonth = new Date(y, m, 1);
  const firstWeekday = mondayIndex(firstOfMonth.getDay()); // 0..6
  const totalDays = daysInMonth(y, m);

  // предыдущий месяц для заполнения "хвоста" слева
  const prevMonth = (m - 1 + 12) % 12;
  const prevYear = m === 0 ? y - 1 : y;
  const prevTotal = daysInMonth(prevYear, prevMonth);

  // подготовим 42 ячейки
  const cells = [];
  // дни предыдущего месяца
  for (let i = firstWeekday - 1; i >= 0; i--){
    cells.push({ day: prevTotal - i, other: true, y: prevYear, m: prevMonth });
  }
  // дни текущего
  for (let i = 1; i <= totalDays; i++){
    cells.push({ day: i, other: false, y, m });
  }
  // добьём до 42
  let nextDay = 1;
  while (cells.length < 42){
    const nextMonth = (m + 1) % 12;
    const nextYear = m === 11 ? y + 1 : y;
    cells.push({ day: nextDay++, other: true, y: nextYear, m: nextMonth });
  }

  // рендер
  calDays.innerHTML = '';
  const today = new Date();
  cells.forEach((c, idx) => {
    const el = document.createElement('div');
    el.className = 'cal-day';

    // номер столбца (0..6) для определения выходных (СБ=5, ВС=6)
    const col = idx % 7;
    const isWeekendCol = (col === 5 || col === 6);

    if (c.other) el.classList.add('other');
    if (isWeekendCol) el.classList.add('weekend');

    const isToday = (!c.other &&
      c.day === today.getDate() &&
      c.m   === today.getMonth() &&
      c.y   === today.getFullYear());
    if (isToday) el.classList.add('today');

    el.textContent = String(c.day);
    calDays.appendChild(el);
  });

  // подпись «Сегодня: …»
  const fmtWeekday = baseDate.toLocaleString('ru', { weekday: 'long' });
  const dd = String(d).padStart(2,'0');
  const mm = String(m+1).padStart(2,'0');
  todayNote.textContent = `Сегодня: ${fmtWeekday}, ${dd}.${mm}.${y}`;
}

/* ---------- Тема ---------- */
if (themeToggle){
  themeToggle.addEventListener('change', ()=>{
    const dark = document.body.classList.contains('animated-background-dark');
    document.body.classList.replace(
      dark ? 'animated-background-dark':'animated-background-light',
      dark ? 'animated-background-light':'animated-background-dark'
    );
  });
}

/* ---------- Погода: Москва (Open-Meteo, без ключей) ---------- */
const MOSCOW = { lat: 55.7558, lon: 37.6173 };

const WMO = {
  0:'ясно',1:'в осн. ясно',2:'переменная облачность',3:'пасмурно',
  45:'туман',48:'изморозь',51:'морось сл.',53:'морось',55:'морось сильн.',
  56:'ледяная морось сл.',57:'ледяная морось сильн.',
  61:'дождь сл.',63:'дождь',65:'дождь сильн.',
  66:'ледяной дождь сл.',67:'ледяной дождь сильн.',
  71:'снег сл.',73:'снег',75:'снегопад',
  77:'снежные зёрна',80:'ливни сл.',81:'ливни',82:'ливни сильн.',
  85:'снег. ливни',86:'снег. ливни сильн.',
  95:'гроза',96:'гроза с градом',99:'сильная гроза с градом'
};

function wdShortName(dateStr){
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('ru-RU', { weekday:'short' }).replace('.', '');
}

async function renderWeatherMoscow(){
  try{
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${MOSCOW.lat}&longitude=${MOSCOW.lon}` +
      `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m` +
      `&daily=temperature_2m_max,temperature_2m_min,weather_code,wind_speed_10m_max` +
      `&timezone=Europe%2FMoscow`;

    const res = await fetch(url, { cache:'no-store' });
    const data = await res.json();

    // ---- текущая погода ----
    const cur = data.current || {};
    const daily = data.daily || {};

    const t  = Math.round(cur.temperature_2m);
    const tf = Math.round(cur.apparent_temperature);
    const ws = Math.round(cur.wind_speed_10m);
    const code = cur.weather_code;
    const desc = WMO[code] || '—';

    const tmin0 = Math.round(daily.temperature_2m_min?.[0] ?? NaN);
    const tmax0 = Math.round(daily.temperature_2m_max?.[0] ?? NaN);

    if (wTemp)  wTemp.textContent  = `${t}°C`;
    if (wFeels) wFeels.textContent = `${tf}°C`;
    if (wWind)  wWind.textContent  = `${ws} м/с`;
    if (wDesc)  wDesc.textContent  = desc;
    if (wMinMax)wMinMax.textContent= `${isFinite(tmin0)?tmin0:'—'}/${isFinite(tmax0)?tmax0:'—'}°C`;

    // ---- 3-дневный прогноз ----
    if (wForecast){
      wForecast.innerHTML = '';
      const days = (daily.time || []).slice(0,3);
      days.forEach((dt, i) => {
        const dMin = Math.round(daily.temperature_2m_min?.[i] ?? NaN);
        const dMax = Math.round(daily.temperature_2m_max?.[i] ?? NaN);
        const dCode= daily.weather_code?.[i];
        const dDesc= WMO[dCode] || '—';
        const wind = Math.round(daily.wind_speed_10m_max?.[i] ?? NaN);

        const el = document.createElement('div');
        el.className = 'w-day';
        el.innerHTML = `
          <div class="wd-name">${wdShortName(dt)}</div>
          <div class="wd-desc">${dDesc}</div>
          <div class="wd-temps"><strong>${isFinite(dMin)?dMin:'—'}/${isFinite(dMax)?dMax:'—'}°C</strong></div>
          <div class="wd-wind" style="font-size:12px;opacity:.9">ветер ${isFinite(wind)?wind:'—'} м/с</div>
        `;
        wForecast.appendChild(el);
      });
    }
  }catch(e){
    console.warn('[Weather] fetch error', e);
    if (wDesc) wDesc.textContent = 'нет данных';
  }
}

// первичный рендер и автообновление погоды
renderWeatherMoscow();
setInterval(renderWeatherMoscow, 10 * 60 * 1000);

/* ---------- LHM: авто-детект URL и парсинг ---------- */
// 1) Кандидаты URL (учтён https-сайт -> нужна та же схема; можно поставить прокси на /data.json)
const CANDIDATES = (() => {
  const isHttps = location.protocol === 'https:';
  const schemes = isHttps ? ['https'] : ['http'];
  const hosts = ['127.0.0.1','localhost'];
  const ports = [8085,8086,8888];
  const urls = [];

  // относительный путь — если настроен прокси с фронта
  urls.push(`${location.origin}/data.json`);

  for (const sch of schemes)
    for (const h of hosts)
      for (const p of ports)
        urls.push(`${sch}://${h}:${p}/data.json`);

  return urls;
})();

let LHM_URL = null;

async function resolveLHM() {
  for (const u of CANDIDATES) {
    try {
      const r = await fetch(u, { cache:'no-store', mode:'cors' });
      const j = await r.clone().json();
      if (j && j.Children) { LHM_URL = u; return; }
    } catch (_) { /* пробуем следующий */ }
  }
  console.warn('Не найден доступный URL LHM');
  throw new Error('Не найден доступный URL LHM');
}

// Утилиты парсинга чисел
const num   = (x)=> +String(x).replace(',','.').match(/-?\d+(?:\.\d+)?/)[0];
const toGHz = (mhz)=> (mhz/1000).toFixed(2) + ' ГГц';

// Флэттен и индекс
function flatten(root){
  const a=[]; const st=[root];
  while(st.length){ const n=st.pop(); a.push(n); const c=n.Children||[]; for(let i=0;i<c.length;i++) st.push(c[i]); }
  return a;
}
function indexById(root){
  const m=new Map(); const st=[root];
  while(st.length){ const n=st.pop(); if(n.SensorId) m.set(n.SensorId,n); const c=n.Children||[]; for(let i=0;i<c.length;i++) st.push(c[i]); }
  return m;
}

// Выбор названия устройства
function deviceName(root, idPrefix, fallback){
  const top = (root.Children?.[0]?.Children) || root.Children || [];
  for (const n of top) {
    const stack=[n];
    while (stack.length){
      const x = stack.pop();
      if ((x.SensorId||'').startsWith(idPrefix)) return n.Text || fallback;
      const ch = x.Children||[]; for (let i=0;i<ch.length;i++) stack.push(ch[i]);
    }
  }
  const byText = top.find(n => (n.Text||'').toLowerCase().includes(fallback.toLowerCase()));
  return byText?.Text || fallback;
}

async function pollLHM(){
  try{
    if (!LHM_URL) await resolveLHM();

    const root = await (await fetch(LHM_URL, {cache:'no-store'})).json();
    const byId = indexById(root);
    const all  = flatten(root);

    // ---- Имена устройств ----
    const cpuName = deviceName(root, '/amdcpu/0', 'CPU');
    const gpuName = deviceName(root, '/gpu-nvidia/0', 'GPU');
    const ramName = (all.find(n => n.Text==='Generic Memory') || {Text:'Memory'}).Text;

    cpuNameEl && (cpuNameEl.textContent = `— ${cpuName}`);
    gpuNameEl && (gpuNameEl.textContent = `— ${gpuName}`);
    ramNameEl && (ramNameEl.textContent = `— ${ramName}`);

    // ---- CPU ----
    const sCpuLoad = byId.get('/amdcpu/0/load/0');
    const sCpuTemp = byId.get('/amdcpu/0/temperature/2');
    const sCpuPwr  = byId.get('/amdcpu/0/power/0');
    const sCpuFan = byId.get('/lpc/it8655e/0/fan/0');

    const cpuCoreClocks = all.filter(s => s.Type==='Clock' && /^Core #\d+$/.test(s.Text));
    const cpuClockAvg = cpuCoreClocks.length ? cpuCoreClocks.reduce((sum,s)=>sum+num(s.Value),0)/cpuCoreClocks.length : NaN;

    const cpuLoad = sCpuLoad ? Math.round(num(sCpuLoad.Value)) : 0;
    const cpuTemp = sCpuTemp ? Math.round(num(sCpuTemp.Value)) : 0;
    const cpuGHz  = isNaN(cpuClockAvg) ? '—' : toGHz(cpuClockAvg);
    const cpuW    = sCpuPwr ? Math.round(num(sCpuPwr.Value)) + ' Вт' : '—';
    const cpuRpm = sCpuFan ? Math.round(num(sCpuFan.Value)) + ' RPM' : '—';

    cpuLoadVal  && (cpuLoadVal.textContent = cpuLoad + '%');
    cpuTempVal  && (cpuTempVal.textContent = cpuTemp + '°C');
    cpuClockVal && (cpuClockVal.textContent= cpuGHz);
    cpuPowerVal && (cpuPowerVal.textContent= cpuW);
    cpuFanVal && (cpuFanVal.textContent = cpuRpm);
    cpuLoadBar  && (cpuLoadBar.style.width = cpuLoad + '%');
    cpuTempBar  && (cpuTempBar.style.width = Math.min(cpuTemp, 100) + '%');

    // ---- GPU ----
    const sGpuLoad  = byId.get('/gpu-nvidia/0/load/0');
    const sGpuTemp  = byId.get('/gpu-nvidia/0/temperature/0');
    const sGpuClock = byId.get('/gpu-nvidia/0/clock/0');
    const sGpuFan   = byId.get('/gpu-nvidia/0/fan/1');

    const gpuLoad = sGpuLoad ? Math.round(num(sGpuLoad.Value)) : 0;
    const gpuTemp = sGpuTemp ? Math.round(num(sGpuTemp.Value)) : 0;
    const gpuGHz  = sGpuClock ? toGHz(num(sGpuClock.Value)) : '—';
    const gpuRpm  = sGpuFan   ? Math.round(num(sGpuFan.Value)) + ' RPM' : '—';

    gpuLoadVal && (gpuLoadVal.textContent = gpuLoad + '%');
    gpuTempVal && (gpuTempVal.textContent = gpuTemp + '°C');
    gpuClockVal&& (gpuClockVal.textContent= gpuGHz);
    gpuFanVal  && (gpuFanVal.textContent  = gpuRpm);
    gpuLoadBar && (gpuLoadBar.style.width = gpuLoad + '%');
    gpuTempBar && (gpuTempBar.style.width = Math.min(gpuTemp, 100) + '%');

    // ---- VRAM ----
    const sVramUsed  = byId.get('/gpu-nvidia/0/smalldata/1');
    const sVramTotal = byId.get('/gpu-nvidia/0/smalldata/2');
    if (vramVal && vramBar){
      if (sVramUsed && sVramTotal){
        const used = num(sVramUsed.Value)  / 1024;
        const tot  = num(sVramTotal.Value) / 1024;
        const pct  = Math.round(used/tot*100);
        vramVal.textContent = `${used.toFixed(1)} / ${tot.toFixed(1)} ГБ (${pct}%)`;
        vramBar.style.width = pct + '%';
      } else {
        vramVal.textContent = '—';
        vramBar.style.width = '0%';
      }
    }

    // ---- RAM ----
    const sRamUsed  = byId.get('/ram/data/0');
    const sRamAvail = byId.get('/ram/data/1');
    if (sRamUsed && sRamAvail && ramVal && ramTextVal && ramBar){
      const ru = num(sRamUsed.Value), ra = num(sRamAvail.Value);
      const rt = ru + ra, rp = Math.round(ru/rt*100);
      ramVal.textContent = rp + '%';
      ramTextVal.textContent = `${ru.toFixed(1)} / ${rt.toFixed(1)} ГБ`;
      ramBar.style.width = rp + '%';
    }

    if (hud) hud.textContent = `LHM: ${LHM_URL}`;
  }catch(e){
    if (hud) hud.textContent = 'LHM недоступен';
    console.warn('[LHM] poll error:', e);
  }
}

// старт опроса
pollLHM();
setInterval(pollLHM, 1000);
