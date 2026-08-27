import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Download } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: string; // ISO date string
  quinceanera_name: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  quinceanera_name,
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(targetDate).getTime();
      const now_utc = new Date().getTime();
      const cstOffsetHours = -6;
      const now = new Date(now_utc + cstOffsetHours * 60 * 60 * 1000).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  // Google Calendar Link generator
  const getGoogleCalendarUrl = () => {
    const eventStart = new Date(targetDate);
    const eventEnd = new Date(eventStart.getTime() + 6 * 60 * 60 * 1000); // 6 hours duration

    const formatGDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');

    const title = encodeURIComponent(`Fiesta de XV Años de ${quinceanera_name}`);
    const details = encodeURIComponent(`Acompáñanos a celebrar los XV años de ${quinceanera_name}. ¡Te esperamos!`);
    const dates = `${formatGDate(eventStart)}/${formatGDate(eventEnd)}`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dates}`;
  };

  return (
    <section className="py-10 px-4 max-w-4xl mx-auto text-center">
      <div className="bg-plumbago border border-plumbago-light rounded-sm p-8 sm:p-12 relative overflow-hidden">
        
        <div className="inline-flex items-center gap-2 bg-secondary text-night px-4 py-1.5 rounded-full text-[10px] font-sans uppercase tracking-[0.3em] font-medium mb-4 border border-plumbago-light">
          <Clock className="w-3.5 h-3.5 text-night" />
          <span>Faltan muy pocos días</span>
        </div>

        <h3 className="font-serif text-3xl sm:text-4xl text-silver-light font-light italic mb-2">
          Cuenta Regresiva
        </h3>
        
        <p className="font-sans text-xs text-silver-light opacity-70 mb-8 max-w-md mx-auto">
          Guardamos cada segundo para celebrar este momento inolvidable
        </p>

        {/* Countdown Grid Cards */}
        {timeLeft.isPast ? (
          <div className="p-6 bg-[#e9e4de] rounded-sm text-silver-light font-serif text-2xl italic">
            ¡El gran día ha llegado! 🎉
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4 sm:gap-8 max-w-xl mx-auto mb-8 py-4 border-y border-plumbago-light">
            {/* Days */}
            <div className="text-center min-w-[60px]">
              <div className="font-serif text-3xl sm:text-4xl font-light text-silver-light mb-1">
                {String(timeLeft.days).padStart(2, '0')}
              </div>
              <div className="text-[9px] uppercase tracking-widest opacity-60 font-sans text-silver-light">
                Días
              </div>
            </div>

            <div className="text-2xl font-light opacity-30 text-silver-light font-serif">:</div>

            {/* Hours */}
            <div className="text-center min-w-[60px]">
              <div className="font-serif text-3xl sm:text-4xl font-light text-silver-light mb-1">
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <div className="text-[9px] uppercase tracking-widest opacity-60 font-sans text-silver-light">
                Horas
              </div>
            </div>

            <div className="text-2xl font-light opacity-30 text-silver-light font-serif">:</div>

            {/* Minutes */}
            <div className="text-center min-w-[60px]">
              <div className="font-serif text-3xl sm:text-4xl font-light text-silver-light mb-1">
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <div className="text-[9px] uppercase tracking-widest opacity-60 font-sans text-silver-light">
                Mins
              </div>
            </div>

            <div className="text-2xl font-light opacity-30 text-silver-light font-serif">:</div>

            {/* Seconds */}
            <div className="text-center min-w-[60px]">
              <div className="font-serif text-3xl sm:text-4xl font-light text-silver-light mb-1">
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
              <div className="text-[9px] uppercase tracking-widest opacity-60 font-sans text-silver-light">
                Segs
              </div>
            </div>
          </div>
        )}

        {/* Add to Google Calendar Action */}
        <a
          href={getGoogleCalendarUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-silver-light hover:bg-secondary text-night font-sans text-[10px] uppercase tracking-[0.2em] font-medium py-3.5 px-6 rounded-sm transition-all duration-300 shadow-sm"
        >
          <Calendar className="w-4 h-4 text-silver" />
          <span>Agendar en Google Calendar</span>
        </a>

      </div>
    </section>
  );
};
