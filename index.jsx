import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const barbers = [
  { name: "Павел", price: 1600 },
  { name: "Артур", price: 2000 },
  { name: "Жора", price: 1090 },
];

const timeSlots = Array.from({ length: 11 }, (_, i) => `${i + 9}:00`);

export default function WebApp() {
  const [barber, setBarber] = useState(null);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);

  useEffect(() => {
    if (window.Telegram.WebApp) {
      window.Telegram.WebApp.expand();
    }
  }, []);

  const handleSubmit = () => {
    if (!barber || !date || !time) return alert("Заполните все поля");
    const data = { barber, date, time };
    window.Telegram.WebApp.sendData(JSON.stringify(data));
  };

  const getNext7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      days.push(d.toISOString().split("T")[0]);
    }
    return days;
  };

  return (
    <div className="min-h-screen p-4 bg-[url('/brick-bg.jpg')] bg-cover text-white">
      <h1 className="text-xl font-bold text-center mb-4">Запись в барбершоп</h1>

      <div className="mb-4">
        <h2 className="mb-2">Выберите мастера:</h2>
        <div className="grid grid-cols-1 gap-2">
          {barbers.map((b) => (
            <Button
              key={b.name}
              onClick={() => setBarber(b.name)}
              variant={barber === b.name ? "default" : "outline"}
              className="rounded-2xl"
            >
              {b.name} ({b.price}₽)
            </Button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h2 className="mb-2">Выберите дату:</h2>
        <div className="grid grid-cols-2 gap-2">
          {getNext7Days().map((d) => (
            <Button
              key={d}
              onClick={() => setDate(d)}
              variant={date === d ? "default" : "outline"}
              className="rounded-2xl"
            >
              {new Date(d).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                weekday: "short",
              })}
            </Button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h2 className="mb-2">Выберите время:</h2>
        <div className="grid grid-cols-3 gap-2">
          {timeSlots.map((t) => (
            <Button
              key={t}
              onClick={() => setTime(t)}
              variant={time === t ? "default" : "outline"}
              className="rounded-2xl"
            >
              {t}
            </Button>
          ))}
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full mt-4 rounded-2xl text-lg font-semibold"
      >
        Записаться
      </Button>
    </div>
  );
}
