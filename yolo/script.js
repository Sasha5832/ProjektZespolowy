/* ---------- KONFIG ---------- */
const API_URL   = 'http://localhost:8000/predict'; // ← zmień, jeśli inny host
const MAX_FILES = 10;

/* ---------- DOM ---------- */
const input     = document.getElementById('image-upload');
const grid      = document.getElementById('preview-container');
const runBtn    = document.getElementById('run-btn');
const btnBar    = document.getElementById('image-buttons');
const detailBox = document.getElementById('detail-box');

/* ---------- DANE ---------- */
let files  = [];          // File[]
const store = [];         // [{detections, unique, fileName}]

/* ---------- OBSŁUGA ZMIANY ROZMIARU MINIATUR ---------- */
const ro = new ResizeObserver(entries => {
  for (const e of entries) {
    const idx = +e.target.dataset.idx;           // nr obrazka
    if (store[idx]?.detections) {
      drawBoxes(idx, store[idx].detections);     // narysuj ponownie
    }
  }
});

/* ---------- PODGLĄD MINIATUR ---------- */
input.addEventListener('change', () => {
  files = [...input.files].slice(0, MAX_FILES);
  grid.innerHTML = '';
  btnBar.innerHTML = '';
  detailBox.innerHTML = '<p>Nie wybrano obrazu.</p>';
  store.length = 0;

  files.forEach((file, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'img-wrap';

    const img = document.createElement('img');
    img.id    = `img-${i}`;
    img.dataset.idx = i;                      // ← identyfikator dla RO
    img.src   = URL.createObjectURL(file);
    img.onload= () => {
      URL.revokeObjectURL(img.src);
      ro.observe(img);                        // ← obserwujemy rozmiar
    };

    const cvs = document.createElement('canvas');
    cvs.id    = `cvs-${i}`;

    wrap.appendChild(img);
    wrap.appendChild(cvs);
    grid.appendChild(wrap);
  });
});

/* ---------- ROZPOCZNIJ DETEKCJE ---------- */
runBtn.addEventListener('click', async () => {
  if (!files.length) return alert('Najpierw wybierz pliki.');

  btnBar.textContent = 'Przetwarzanie…';

  for (let i = 0; i < files.length; i++) {
    const fd = new FormData();
    fd.append('file', files[i]);

    let dets = [];
    try {
      const r = await fetch(API_URL, { method: 'POST', body: fd });
      if (r.ok) dets = (await r.json()).detections;
    } catch (e) { console.error(e); }

    const uniq = [...new Set(dets.map(d => d.label))];
    store[i] = { detections: dets, unique: uniq, fileName: files[i].name };

    drawBoxes(i, dets);                       // pierwszy rzut ramek
  }
  buildBtnBar();
});

/* ---------- RYSOWANIE RAMEK ---------- */
function drawBoxes(i, dets) {
  const img = document.getElementById(`img-${i}`);
  const cvs = document.getElementById(`cvs-${i}`);

  if (!img.complete || img.clientHeight === 0) {
    requestAnimationFrame(() => drawBoxes(i, dets));
    return;
  }

  cvs.width  = img.clientWidth;
  cvs.height = img.clientHeight;
  const ctx  = cvs.getContext('2d');
  ctx.clearRect(0, 0, cvs.width, cvs.height);

  const sx = cvs.width  / img.naturalWidth;
  const sy = cvs.height / img.naturalHeight;

  ctx.strokeStyle = '#ffbd39';
  ctx.lineWidth   = 2;
  ctx.font        = '14px Poppins';
  ctx.fillStyle   = '#000';
  ctx.strokeStyle = '#ffbd39';
  ctx.lineWidth   = 3;

  dets.forEach(d => {
    const [x1, y1, x2, y2] = d.bbox;
    ctx.strokeRect(x1 * sx, y1 * sy, (x2 - x1) * sx, (y2 - y1) * sy);
    ctx.strokeText(d.label, x1 * sx + 4, y1 * sy + 15);
    ctx.fillText  (d.label, x1 * sx + 3, y1 * sy + 15);
  });
}

/* ---------- PRZYCISKI OBRAZÓW ---------- */
function buildBtnBar() {
  btnBar.innerHTML = '';
  store.forEach((rec, i) => {
    const b = document.createElement('button');
    b.className = 'thumb-btn';
    b.dataset.idx = i;
    b.textContent = `Obraz ${i + 1} (${rec.detections.length})`;
    b.onclick = selectImg;
    btnBar.appendChild(b);
  });
  btnBar.firstChild && btnBar.firstChild.click();
}

/* ---------- PANEL SZCZEGÓŁÓW ---------- */
function selectImg(e) {
  [...btnBar.children].forEach(b => b.classList.remove('active'));
  e.currentTarget.classList.add('active');

  const i = +e.currentTarget.dataset.idx;
  const { fileName, detections, unique } = store[i];

  const desc = {
    /* --- A – znaki ostrzegawcze --- */
    'A-1':  'Niebezpieczny zakręt w prawo',
    'A-2':  'Niebezpieczny zakręt w lewo',
    'A-3':  'Niebezpieczne zakręty, pierwszy w prawo',
    'A-4':  'Niebezpieczne zakręty, pierwszy w lewo',
    'A-5':  'Skrzyżowanie dróg',
    'A-6a': 'Skrzyżowanie z drogą podporządkowaną po prawej',
    'A-6b': 'Skrzyżowanie z drogą podporządkowaną po lewej',
    'A-6c': 'Skrzyżowanie z drogą podporządkowaną po obu stronach',
    'A-6d': 'Wlot drogi jednokierunkowej z prawej strony',
    'A-6e': 'Wlot drogi jednokierunkowej z lewej strony',
    'A-7':  'Ustąp pierwszeństwa',
    'A-8':  'Skrzyżowanie o ruchu okrężnym',
    'A-9':  'Przejazd kolejowy z zaporami',
    'A-10': 'Przejazd kolejowy bez zapór',
    'A-11': 'Nierówna droga',
    'A-11a':'Próg zwalniający',
    'A-12a':'Zwężenie jezdni – dwustronne',
    'A-12b':'Zwężenie jezdni – prawostronne',
    'A-12c':'Zwężenie jezdni – lewostronne',
    'A-13': 'Ruchomy most',
    'A-14': 'Roboty na drodze',
    'A-15': 'Śliska jezdnia',
    'A-16': 'Przejście dla pieszych',
    'A-17': 'Dzieci',
    'A-18a':'Zwierzęta gospodarskie',
    'A-18b':'Zwierzęta dzikie',
    'A-19': 'Boczny wiatr',
    'A-20': 'Odcinek jezdni o ruchu dwukierunkowym',
    'A-21': 'Przejazd przez tory tramwajowe',
    'A-22': 'Niebezpieczny zjazd',
    'A-23': 'Stromy podjazd',
    'A-24': 'Rowerzyści',
    'A-25': 'Spadające odłamki skalne',
    'A-26': 'Lotnisko',
    'A-27': 'Nabrzeże lub brzeg rzeki',
    'A-28': 'Sypki żwir',
    'A-29': 'Sygnały świetlne',
    'A-30': 'Inne niebezpieczeństwo',
    'A-31': 'Niebezpieczne pobocze',
    'A-32': 'Oszronienie jezdni',
    'A-33': 'Zator drogowy',
    'A-34': 'Wypadek drogowy',

    /* --- B – zakazy --- */
    'B-1':  'Zakaz ruchu w obu kierunkach',
    'B-2':  'Zakaz wjazdu',
    'B-3':  'Zakaz wjazdu pojazdów silnikowych',
    'B-3a': 'Zakaz wjazdu autobusów',
    'B-4':  'Zakaz wjazdu motocykli',
    'B-5':  'Zakaz wjazdu samochodów ciężarowych',
    'B-6':  'Zakaz wjazdu ciągników rolniczych',
    'B-7':  'Zakaz wjazdu pojazdów silnikowych z przyczepą',
    'B-8':  'Zakaz wjazdu pojazdów zaprzęgowych',
    'B-9':  'Zakaz wjazdu rowerów',
    'B-10': 'Zakaz wjazdu motorowerów',
    'B-11': 'Zakaz wjazdu wózków rowerowych i rowerów wielośladowych',
    'B-12': 'Zakaz wjazdu wózków ręcznych',
    'B-13': 'Zakaz wjazdu pojazdów z materiałami wybuchowymi lub łatwo zapalnymi',
    'B-13a':'Zakaz wjazdu pojazdów z materiałami niebezpiecznymi',
    'B-14': 'Zakaz wjazdu pojazdów z materiałami mogącymi skazić wodę',
    'B-15': 'Zakaz wjazdu pojazdów o długości ponad … m',
    'B-16': 'Zakaz wjazdu pojazdów o szerokości ponad … m',
    'B-17': 'Zakaz wjazdu pojazdów o wysokości ponad … m',
    'B-18': 'Zakaz wjazdu pojazdów o masie całkowitej ponad … t',
    'B-19': 'Zakaz wjazdu pojazdów o nacisku osi ponad … t',
    'B-20': 'Stop',
    'B-21': 'Zakaz skrętu w lewo',
    'B-22': 'Zakaz skrętu w prawo',
    'B-23': 'Zakaz zawracania',
    'B-24': 'Koniec zakazu zawracania',
    'B-25': 'Zakaz wyprzedzania',
    'B-26': 'Zakaz wyprzedzania przez samochody ciężarowe',
    'B-27': 'Koniec zakazu wyprzedzania',
    'B-28': 'Koniec zakazu wyprzedzania przez samochody ciężarowe',
    'B-29': 'Zakaz używania sygnałów dźwiękowych',
    'B-30': 'Koniec zakazu używania sygnałów dźwiękowych',
    'B-31': 'Pierwszeństwo dla nadjeżdżających z przeciwka',
    'B-32': 'Pierwszeństwo na zwężonym odcinku jezdni',
    'B-33': 'Ograniczenie prędkości',
    'B-34': 'Koniec ograniczenia prędkości',
    'B-35': 'Zakaz postoju',
    'B-36': 'Zakaz zatrzymywania się',
    'B-37': 'Zakaz postoju w dni nieparzyste',
    'B-38': 'Zakaz postoju w dni parzyste',
    'B-39': 'Strefa ograniczonego postoju',
    'B-40': 'Koniec strefy ograniczonego postoju',
    'B-41': 'Zakaz ruchu pieszych',
    'B-42': 'Koniec zakazów',
    'B-43': 'Strefa ograniczonej prędkości',
    'B-44': 'Koniec strefy ograniczonej prędkości',

    /* --- C – nakazy --- */
    'C-1':  'Nakaz jazdy w prawo **przed** znakiem',
    'C-2':  'Nakaz jazdy w prawo **za** znakiem',
    'C-3':  'Nakaz jazdy w lewo **przed** znakiem',
    'C-4':  'Nakaz jazdy w lewo **za** znakiem',
    'C-5':  'Nakaz jazdy na wprost',
    'C-6':  'Nakaz jazdy na wprost lub w prawo',
    'C-7':  'Nakaz jazdy na wprost lub w lewo',
    'C-8':  'Nakaz jazdy w prawo lub w lewo',
    'C-9':  'Nakaz jazdy z prawej strony znaku',
    'C-10': 'Nakaz jazdy z lewej strony znaku',
    'C-11': 'Nakaz jazdy z prawej lub z lewej strony znaku',
    'C-12': 'Ruch okrężny',
    'C-13': 'Droga dla rowerów',
    'C-13a':'Koniec drogi dla rowerów',
    'C-14': 'Prędkość minimalna',
    'C-15': 'Koniec minimalnej prędkości',
    'C-16': 'Droga dla pieszych',
    'C-16a':'Koniec drogi dla pieszych',
    'C-17': 'Nakazany kierunek jazdy dla pojazdów z materiałami niebezpiecznymi',
    'C-18': 'Nakaz używania łańcuchów przeciwpoślizgowych',
    'C-19': 'Koniec nakazu używania łańcuchów przeciwpoślizgowych',

    /* --- D – informacyjne (skrót nazewnictwa wg rozporządzenia) --- */
    'D-1':  'Droga z pierwszeństwem',
    'D-2':  'Koniec drogi z pierwszeństwem',
    'D-3':  'Droga jednokierunkowa',
    'D-4a': 'Droga bez przejazdu',
    'D-4b': 'Wjazd na drogę bez przejazdu',
    'D-5':  'Pierwszeństwo na zwężonym odcinku jezdni',
    'D-6':  'Przejście dla pieszych',
    'D-6a': 'Przejazd dla rowerzystów',
    'D-6b': 'Przejście i przejazd dla rowerzystów',
    'D-7':  'Droga ekspresowa',
    'D-8':  'Koniec drogi ekspresowej',
    'D-9':  'Autostrada',
    'D-10': 'Koniec autostrady',
    'D-11': 'Początek pasa ruchu dla autobusów',
    'D-12': 'Pas ruchu dla autobusów',
    'D-13': 'Sygnalizacja świetlna (szpital/ratunek)',
    'D-13a':'Punkt opatrunkowy',
    'D-14': 'Telefon alarmowy',
    'D-15': 'Początek autostrady',
    'D-16': 'Koniec autostrady',
    'D-17': 'Punkt informacji turystycznej',
    'D-18a':'Parking',
    'D-18b':'Parking (sam. osobowe)',
    'D-19': 'Postój taksówek',
    'D-20': 'Stacja paliw',
    'D-21': 'Stacja obsługi pojazdów',
    'D-21a':'Stacja paliw i obsługi',
    'D-22': 'Myjnia',
    'D-23': 'Telefon',
    'D-23a':'Telefon alarmowy',
    'D-24': 'Punkt medyczny',
    'D-25': 'Apteka',
    'D-26': 'Hotel/motel',
    'D-26a':'Zajazd',
    'D-26b':'Zajazd (gastronomia)',
    'D-26c':'Bufet',
    'D-26d':'Restauracja',
    'D-27': 'Kemping',
    'D-28': 'Pole biwakowe',
    'D-29': 'Schronisko młodzieżowe',
    'D-30': 'Obozowisko (camping)',
    'D-31': 'Obozowisko (camping) z prądem',
    'D-32': 'Pole biwakowe',
    'D-33': 'Schronisko młodzieżowe',
    'D-34': 'Punkt informacji turystycznej',
    'D-34a':'Informacja radiowa o ruchu',
    'D-35': 'Przejście podziemne dla pieszych',
    'D-35a':'Przejście nadziemne dla pieszych',
    'D-36': 'Tunel',
    'D-37': 'Most zwodzony',
    'D-38': 'Przejazd kolejowy',
    'D-39': 'Początek pasa awaryjnego',
    'D-40': 'Strefa zamieszkania',
    'D-41': 'Koniec strefy zamieszkania',
    'D-42': 'Obszar zabudowany',
    'D-43': 'Koniec obszaru zabudowanego',
    'D-44': 'Strefa płatnego parkowania',
    'D-45': 'Koniec strefy płatnego parkowania',
    'D-46': 'Droga wewnętrzna',
    'D-47': 'Koniec drogi wewnętrznej',
    'D-48': 'Promenada pieszo-jezdna',
    'D-49': 'Koniec promenady pieszo-jezdnej',
    'D-50': 'Droga bez przejazdu dla pieszych i rowerzystów',
    'D-51': 'Automatyczna kontrola prędkości',

    /* --- F – uzupełniające --- */
    'F-1':  'Przejście graniczne',
    'F-2':  'Przekraczanie granicy zabronione',
    'F-2a': 'Granica państwa',
    'F-3':  'Granica obszaru administracyjnego',
    'F-4':  'Nazwa rzeki',
    'F-5':  'Uprzedzenie o zakazie',
    'F-6':  'Znak uprzedzający przed skrzyżowaniem',
    'F-7':  'Sposób jazdy przy zakazie skrętu w lewo',
    'F-8':  'Objazd w związku z zamknięciem drogi',
    'F-9':  'Znak prowadzący na drodze objazdowej',
    'F-10': 'Kierunki na pasach ruchu',
    'F-11': 'Kierunki na pasie ruchu',
    'F-12': 'Przejazd tranzytowy (przed skrzyżowaniem)',
    'F-13': 'Przejazd tranzytowy',
    'F-14a':'Tablica wskaźnikowa na autostradzie – kierunek',
    'F-14b':'Tablica wskaźnikowa na autostradzie – numer',
    'F-14c':'Tablica wskaźnikowa na drodze ekspresowej',
    'F-15': 'Numer drogi krajowej',
    'F-16': 'Numer drogi wojewódzkiej',
    'F-17': 'Koniec pasa ruchu na drodze jednokierunkowej',
    'F-18': 'Przeciwny kierunek dla określonych pojazdów',
    'F-19': 'Pas ruchu dla określonych pojazdów',
    'F-20': 'Część drogi dla określonych pojazdów',
    'F-21': 'Pas ruchu dla rowerów',
    'F-22': 'Ograniczenia na pasie ruchu',

    /* --- G – dodatkowe przed przejazdami kolejowymi --- */
    'G-1a': 'Słupek wskaźnikowy, 3 kreski (prawa strona)',
    'G-1b': 'Słupek wskaźnikowy, 2 kreski (prawa strona)',
    'G-1c': 'Słupek wskaźnikowy, 1 kreska  (prawa strona)',
    'G-1d': 'Słupek wskaźnikowy, 3 kreski (lewa strona)',
    'G-1e': 'Słupek wskaźnikowy, 2 kreski (lewa strona)',
    'G-1f': 'Słupek wskaźnikowy, 1 kreska  (lewa strona)',
    'G-2':  'Sieć trakcyjna pod napięciem',
    'G-3':  'Progi zwalniające na torze',
    'G-4':  'Most zwodzony – sygnalizacja',

    /* --- P – oznakowanie poziome (strzałki) --- */
    'P-8a': 'Strzałka kierunkowa na wprost',
    'P-8b': 'Strzałka kierunkowa w lewo',
    'P-8c': 'Strzałka kierunkowa do zawracania',
    'P-8d': 'Strzałka kierunkowa w prawo',
    'P-8e': 'Strzałka kierunkowa na wprost lub w lewo',
    'P-8f': 'Strzałka kierunkowa na wprost lub w prawo',
    'P-8g': 'Strzałka kierunkowa w lewo lub w prawo',
    'P-8h': 'Strzałka kierunkowa na wprost lub zawracanie',
    'P-8i': 'Strzałka kierunkowa nakazująca opuszczenie pasa',
    'P-9':  'Strzałka naprowadzająca',
    'P-9b': 'Strzałka naprowadzająca ukośna'
  };


  detailBox.innerHTML = `
    <p><strong>${fileName}</strong></p>
    <p>Wykryto <strong>${detections.length}</strong> znak(i).</p>
    <p>Etykiety:</p>
    <ul>
      ${unique.map(l => `<li><strong>${l}</strong> – ${desc[l] || 'opis nieznany'}</li>`).join('')}
    </ul>
  `;
}
