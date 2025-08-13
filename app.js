(function(){
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  if (tg) { tg.expand(); }

  // Optional: API endpoint for availability (?api=https://host:8080)
  const API_BASE = new URLSearchParams(location.search).get('api') || (window.API_BASE || '');

  // Barber list must match the bot
  const BARBERS = [
    { name: "Павел", price: 1600 },
    { name: "Артур", price: 2000 },
    { name: "Жора",  price: 1090 },
  ];
  const TIME_SLOTS = Array.from({length: 11}, (_,i)=> (i+9).toString().padStart(2,'0') + ":00");

  const el = (sel) => document.querySelector(sel);
  const barbersEl = el("#barbers");
  const dateEl = el("#date");
  const gridEl = el("#time-grid");
  const submitEl = el("#submit");
  const noteEl = el("#note");

  let selectedBarber = BARBERS[0].name;
  let selectedTime = null;
  let serverNow = null; // Align "past" with server time if provided

  // Populate barbers segmented control
  BARBERS.forEach(({name, price}, idx) => {
    const b = document.createElement("button");
    b.className = "seg" + (idx===0 ? " active" : "");
    b.textContent = `${name} (${price}₽)`;
    b.onclick = () => {
      [...barbersEl.children].forEach(c => c.classList.remove("active"));
      b.classList.add("active");
      selectedBarber = name;
      selectedTime = null;
      renderTimeGrid([]); // reset while loading
      loadAvailability();
    };
    barbersEl.appendChild(b);
  });

  // Init date range: today .. today+6 (7 days forward)
  const today = new Date();
  const toISODate = (d) => d.toISOString().slice(0,10);
  const maxDate = new Date(today); maxDate.setDate(today.getDate() + 6);
  dateEl.value = toISODate(today);
  dateEl.min = toISODate(today);
  dateEl.max = toISODate(maxDate);

  dateEl.addEventListener('change', () => {
    // enforce max/min even if user types manually
    const d = new Date(dateEl.value);
    if (d < new Date(dateEl.min)) dateEl.value = dateEl.min;
    if (d > new Date(dateEl.max)) dateEl.value = dateEl.max;
    selectedTime = null;
    renderTimeGrid([]);
    loadAvailability();
  });

  function setNote(msg){ noteEl.textContent = msg || ""; }

  function isPast(dateStr, timeStr){
    const base = serverNow ? new Date(serverNow) : new Date();
    const [h,m] = timeStr.split(':').map(Number);
    const d = new Date(dateStr + "T00:00:00");
    d.setHours(h, m, 0, 0);
    return d.getTime() <= base.getTime();
  }

  function renderTimeGrid(busyList){
    gridEl.innerHTML = "";
    const dateVal = dateEl.value;

    TIME_SLOTS.forEach(t => {
      const btn = document.createElement("button");
      btn.className = "time";
      btn.textContent = t;

      const disabled = busyList.includes(t) || isPast(dateVal, t);
      if (disabled) btn.classList.add("disabled");

      if (!disabled) {
        btn.onclick = () => {
          // select single
          [...gridEl.querySelectorAll(".time")].forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          selectedTime = t;
        };
      }

      gridEl.appendChild(btn);
    });
  }

  async function loadAvailability(){
    // If no API configured, just render without busy info
    if (!API_BASE) {
      renderTimeGrid([]);
      setNote("Подсказка: добавьте ?api=https://host:8080 к URL WebApp, чтобы отмечать занятые слоты.");
      return;
    }
    try{
      setNote("Загружаем занятость…");
      const url = `${API_BASE.replace(/\/$/,'')}/availability?barber=${encodeURIComponent(selectedBarber)}&date=${encodeURIComponent(dateEl.value)}`;
      const res = await fetch(url, { method: "GET" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const busy = Array.isArray(data.busy) ? data.busy : [];
      serverNow = data.now || null;
      renderTimeGrid(busy);
      setNote(busy.length ? "Серые слоты недоступны." : "Все слоты свободны.");
    } catch (e){
      console.error(e);
      setNote("Не удалось загрузить занятость — показываем все слоты. Проверьте API.");
      renderTimeGrid([]);
    }
  }

  // First render and load
  renderTimeGrid([]);
  loadAvailability();

  // Submit booking
  submitEl.onclick = () => {
    const date = dateEl.value;
    const time = selectedTime;
    if(!selectedBarber || !date || !time){
      setNote("Выберите мастера, дату и свободное время.");
      if (tg) tg.HapticFeedback && tg.HapticFeedback.notificationOccurred("error");
      return;
    }

    const payload = { action: "book", barber: selectedBarber, date, time };

    submitEl.disabled = true;
    setNote("Отправляем запрос… проверьте чат с ботом.");
    try {
      if (tg) {
        tg.sendData(JSON.stringify(payload));
        tg.HapticFeedback && tg.HapticFeedback.notificationOccurred("success");
        setTimeout(()=> tg.close && tg.close(), 500);
      } else {
        alert("WebApp SDK недоступен. Данные:\n" + JSON.stringify(payload, null, 2));
      }
    } finally {
      setTimeout(()=> submitEl.disabled = false, 1200);
    }
  };

})();