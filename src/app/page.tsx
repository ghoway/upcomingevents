'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Calendar, Clock, Monitor, Wifi, WifiOff, ChevronLeft, ChevronRight } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  room: { id: string; name: string; isMainRoom: boolean };
  employee: {
    name: string;
    department: { id: string; name: string };
  };
}

export default function TVDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    return format(new Date(), 'yyyy-MM-dd');
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/events?date=${selectedDate}`);
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading((prev) => prev ? false : prev);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Real-time clock
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket for live updates
  const { isConnected } = useWebSocket((msg) => {
    if (msg.type === 'event-updated') {
      fetchEvents();
    }
  });

  const confirmedEvents = events.filter((e) => e.status === 'APPROVED');
  const waitingEvents = events.filter((e) => e.status === 'PENDING');

  const formattedDate = (() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      return format(new Date(y, m - 1, d), 'EEEE, dd MMMM yyyy', { locale: idLocale });
    } catch {
      return selectedDate;
    }
  })();

  const changeDate = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d + days);
    setSelectedDate(format(dt, 'yyyy-MM-dd'));
  };

  // Group events by room
  const groupByRoom = (eventList: Event[]) => {
    const groups: Record<string, Event[]> = {};
    eventList.forEach((e) => {
      const roomName = e.room.name;
      if (!groups[roomName]) groups[roomName] = [];
      groups[roomName].push(e);
    });
    return groups;
  };

  const confirmedByRoom = groupByRoom(confirmedEvents);
  const waitingByRoom = groupByRoom(waitingEvents);

  return (
    <div className="min-h-screen tv-gradient p-6 lg:p-8">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Monitor className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Dasbor Ruang Rapat
              </h1>
              <p className="text-sm text-text-muted mt-0.5">
                Jadwal Penggunaan Ruang Rapat
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {/* Connection status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              isConnected 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {isConnected ? 'Live' : 'Offline'}
            </div>
            {/* Clock */}
            <div className="text-right">
              <div className="text-3xl lg:text-4xl font-bold text-text tabular-nums tracking-tight">
                {format(currentTime, 'HH:mm:ss')}
              </div>
              <div className="text-xs text-text-muted">
                {format(currentTime, 'EEEE, dd MMM yyyy', { locale: idLocale })}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Date Filter */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => changeDate(-1)}
          className="p-2 rounded-lg bg-surface-light hover:bg-surface-lighter border border-border transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-light border border-border">
          <Calendar className="w-5 h-5 text-primary-light" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-white font-medium text-lg border-none outline-none cursor-pointer"
          />
          <span className="text-text-muted text-sm ml-2">({formattedDate})</span>
        </div>
        <button
          onClick={() => changeDate(1)}
          className="p-2 rounded-lg bg-surface-light hover:bg-surface-lighter border border-border transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <button
          onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
          className="px-4 py-2 rounded-lg bg-primary/10 text-primary-light border border-primary/20 hover:bg-primary/20 text-sm font-medium transition-colors"
        >
          Hari Ini
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* CONFIRMED Section */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-1 w-8 rounded-full bg-emerald-500" />
              <h2 className="text-lg font-bold text-emerald-400 uppercase tracking-wider">
                [CONFIRMED] Jadwal yang telah disetujui pada {formattedDate}
              </h2>
            </div>

            {confirmedEvents.length === 0 ? (
              <div className="bg-surface-light/50 border border-border rounded-xl p-8 text-center">
                <p className="text-text-muted text-lg">Tidak ada jadwal yang dikonfirmasi</p>
              </div>
            ) : (
              Object.entries(confirmedByRoom).map(([roomName, roomEvents]) => (
                <div key={roomName} className="mb-4">
                  <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2 pl-2">
                    {roomName}
                  </h3>
                  <div className="bg-surface-light/30 backdrop-blur-sm border border-border rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-surface-lighter/50 border-b border-border">
                          <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider w-[18%]">Unit Kerja</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider w-[18%]">Nama PIC</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Judul Agenda</th>
                          <th className="text-center px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider w-[10%]">Start</th>
                          <th className="text-center px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider w-[10%]">End</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roomEvents.map((event, idx) => (
                          <tr
                            key={event.id}
                            className={`border-b border-border/50 hover:bg-surface-lighter/30 transition-colors ${
                              idx % 2 === 0 ? 'bg-transparent' : 'tv-table-row-alt'
                            }`}
                          >
                            <td className="px-5 py-3 text-sm font-medium text-text">{event.employee.department.name}</td>
                            <td className="px-5 py-3 text-sm text-text">{event.employee.name}</td>
                            <td className="px-5 py-3 text-sm text-text">{event.title}</td>
                            <td className="px-5 py-3 text-sm text-center font-mono tv-confirmed-time">{event.startTime}</td>
                            <td className="px-5 py-3 text-sm text-center font-mono tv-confirmed-time">{event.endTime}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </section>

          {/* WAITING LIST Section */}
          {waitingEvents.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-1 w-8 rounded-full bg-amber-500" />
                <h2 className="text-lg font-bold tv-waiting-text uppercase tracking-wider">
                  [WAITING LIST] Usulan yang akan dikonfirmasi pada {formattedDate}
                </h2>
              </div>

              {Object.entries(waitingByRoom).map(([roomName, roomEvents]) => (
                <div key={roomName} className="mb-4">
                  <h3 className="text-sm font-semibold tv-waiting-text uppercase tracking-wider mb-2 pl-2 opacity-80">
                    {roomName}
                  </h3>
                  <div className="tv-waiting-bg backdrop-blur-sm border tv-waiting-border rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="tv-waiting-header-bg border-b tv-waiting-border">
                          <th className="text-left px-5 py-3 text-xs font-semibold tv-waiting-text uppercase tracking-wider w-[18%] opacity-80">Unit Kerja</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold tv-waiting-text uppercase tracking-wider w-[18%] opacity-80">Nama PIC</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold tv-waiting-text uppercase tracking-wider opacity-80">Judul Agenda</th>
                          <th className="text-center px-5 py-3 text-xs font-semibold tv-waiting-text uppercase tracking-wider w-[10%] opacity-80">Start</th>
                          <th className="text-center px-5 py-3 text-xs font-semibold tv-waiting-text uppercase tracking-wider w-[10%] opacity-80">End</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roomEvents.map((event, idx) => (
                          <tr
                            key={event.id}
                            className={`border-b tv-waiting-border hover:bg-amber-500/5 transition-colors ${
                              idx % 2 === 0 ? 'bg-transparent' : 'tv-waiting-bg'
                            }`}
                          >
                            <td className="px-5 py-3 text-sm font-medium text-text">{event.employee.department.name}</td>
                            <td className="px-5 py-3 text-sm text-text-muted">{event.employee.name}</td>
                            <td className="px-5 py-3 text-sm text-text-muted">{event.title}</td>
                            <td className="px-5 py-3 text-sm text-center font-mono tv-waiting-time">{event.startTime}</td>
                            <td className="px-5 py-3 text-sm text-center font-mono tv-waiting-time">{event.endTime}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* No events at all */}
          {events.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <Calendar className="w-20 h-20 text-text-muted/30 mb-4" />
              <p className="text-xl text-text-muted">Tidak ada agenda pada tanggal ini</p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="mt-8 pt-4 border-t border-border/30 flex flex-col items-center gap-1 text-xs text-text-muted">
        <span>© {new Date().getFullYear()} Wahyu Hidayatullah. All rights reserved.</span>
        <span>
          Crafted with ♥ by <a href="https://github.com/ghoway" target="_blank" rel="noopener noreferrer" className="text-primary-light hover:text-primary underline underline-offset-2 transition-colors">Wahyu Hidayatullah</a>
        </span>
      </footer>
    </div>
  );
}
