(function(){
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  if (tg) { tg.expand(); }

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
  const timeEl = el("#time");
  const submitEl = el("#submit");
  const noteEl = el("#note");

  // Populate barbers segmented control
  let selectedBarber = BARBERS[0].name;
  BARBERS.forEach(({name, price}, idx) => {
    const b = document.createElement("button");
    b.className = "seg" + (idx===0 ? " active" : "");
    b.textContent = `${name} (${price}₽)`;
    b.onclick = () => {
      [...barbersEl.children].forEach(c => c.classList.remove("active"));
      b.classList.add("active");
      selectedBarber = name;
    };
    barbersEl.appendChild(b);
  });

  // Init date (today) and time slots
  const today = new Date();
  const toISODate = (d) => d.toISOString().slice(0,10);
  dateEl.value = toISODate(today);
  dateEl.min = toISODate(today);

  TIME_SLOTS.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t; opt.textContent = t;
    timeEl.appendChild(opt);
  });

  function setNote(msg){
    noteEl.textContent = msg || "";
  }

  submitEl.onclick = () => {
    const date = dateEl.value;
    const time = timeEl.value;
    if(!selectedBarber || !date || !time){
      setNote("Заполните все поля.");
      if (tg) tg.HapticFeedback && tg.HapticFeedback.notificationOccurred("error");
      return;
    }

    const payload = {
      action: "book",
      barber: selectedBarber,
      date: date,
      time: time
    };

    // Disable during send
    submitEl.disabled = true;
    setNote("Отправляем запрос… проверьте чат с ботом для результата.");

    try {
      if (tg) {
        tg.sendData(JSON.stringify(payload));
        tg.HapticFeedback && tg.HapticFeedback.notificationOccurred("success");
        // Optionally close webapp after short delay
        setTimeout(()=> tg.close && tg.close(), 500);
      } else {
        // Fallback for testing in browser
        alert("WebApp SDK недоступен. Данные:\n" + JSON.stringify(payload, null, 2));
      }
    } finally {
      // Keep disabled briefly to prevent double-click
      setTimeout(()=> submitEl.disabled = false, 1200);
    }
  };

})();