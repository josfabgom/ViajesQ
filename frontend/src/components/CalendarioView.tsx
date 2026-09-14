import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import es from 'date-fns/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'es': es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarioViewProps {
  trips: any[];
  drivers: any[];
  passengers: any[];
  places: any[];
  priceRates: any[];
  openModal: (type: string, item?: any) => void;
  handleDelete: (type: string, id: string) => void;
  settings?: any;
}

const CustomToolbar = (toolbar: any) => {
  const goToBack = () => {
    toolbar.onNavigate('PREV');
  };

  const goToNext = () => {
    toolbar.onNavigate('NEXT');
  };

  const goToCurrent = () => {
    toolbar.onNavigate('TODAY');
  };

  const label = () => {
    return (
      <span className="rbc-toolbar-label" style={{ fontWeight: 600, fontSize: '1.1rem', textTransform: 'capitalize' }}>
        {toolbar.label}
      </span>
    );
  };

  return (
    <div className="custom-calendar-toolbar">
      <div className="toolbar-navigation">
        <button className="toolbar-btn" onClick={goToBack}>&#10094;</button>
        <button className="toolbar-btn today-btn" onClick={goToCurrent}>Hoy</button>
        <button className="toolbar-btn" onClick={goToNext}>&#10095;</button>
      </div>
      
      <div className="toolbar-label">
        {label()}
      </div>

      <div className="toolbar-views">
        <select 
          className="form-control view-select" 
          value={toolbar.view} 
          onChange={(e) => toolbar.onView(e.target.value)}
        >
          <option value="month">Mes</option>
          <option value="week">Semana</option>
          <option value="day">Día</option>
          <option value="agenda">Agenda</option>
        </select>
      </div>
    </div>
  );
};

const stringToColor = (str: string) => {
  if (!str) return '#94a3b8'; // Default grey for no driver
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    '#4f46e5', '#0ea5e9', '#8b5cf6', '#ec4899', 
    '#f43f5e', '#14b8a6', '#10b981', '#f59e0b', 
    '#d946ef', '#64748b', '#059669', '#dc2626'
  ];
  return colors[Math.abs(hash) % colors.length];
};

export function CalendarioView({ trips, openModal, settings }: CalendarioViewProps) {
  const [view, setView] = useState<any>('month');
  
  // Set default view once settings are loaded
  React.useEffect(() => {
    if (settings?.calendar_default_view) {
      setView(settings.calendar_default_view);
    }
  }, [settings?.calendar_default_view]);

  const [date, setDate] = useState(new Date());

  // Map trips to calendar events
  const events = trips.map(trip => {
    // If it doesn't have a scheduled_time, fall back to created_at
    const start = new Date(trip.scheduled_time || trip.created_at);
    // Assume trips take 1 hour for display purposes if ended_at is null
    const end = trip.ended_at ? new Date(trip.ended_at) : new Date(start.getTime() + 60 * 60 * 1000);
    
    const statusIcon = trip.status === 'in_progress' ? '🚕 ' : trip.status === 'completed' ? '✅ ' : '🗓️ ';

    return {
      id: trip.id,
      title: `${statusIcon}${trip.driver_name || 'Sin Chofer'} ➔ ${trip.passenger_name || 'Sin Pasajero'}`,
      start,
      end,
      resource: trip,
    };
  });

  const handleSelectSlot = ({ start }: { start: Date }) => {
    // Convert to ISO string to pass to modal
    openModal('trip', { scheduled_time: start.toISOString(), status: 'scheduled' });
  };

  const handleSelectEvent = (event: any) => {
    openModal('trip', event.resource);
  };

  // Determine min and max time for calendar day/week view
  const getMinTime = () => {
    const timeString = settings?.calendar_start_time || '00:00';
    const [hours, minutes] = timeString.split(':');
    const d = new Date();
    d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    return d;
  };

  const getMaxTime = () => {
    const timeString = settings?.calendar_end_time || '23:59';
    const [hours, minutes] = timeString.split(':');
    const d = new Date();
    d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 59, 999);
    return d;
  };

  return (
    <div className="card calendar-card" style={{ height: '80vh', padding: '15px' }}>
      <div className="calendar-header">
        <h3 style={{ margin: 0 }}>📅 Calendario de Viajes</h3>
        <button className="btn" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => openModal('trip')}>+ Programar Viaje</button>
      </div>
      
      <div style={{ height: 'calc(100% - 60px)' }}>
        <Calendar
          localizer={localizer}
          events={events}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          startAccessor="start"
          endAccessor="end"
          min={getMinTime()}
          max={getMaxTime()}
          style={{ height: '100%', fontFamily: 'Inter, sans-serif' }}
          culture="es"
          components={{
            toolbar: CustomToolbar
          }}
          messages={{
            noEventsInRange: "No hay viajes programados en este rango.",
          }}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={(event) => {
            const backgroundColor = stringToColor(event.resource.driver_name || event.resource.id);
            const opacity = event.resource.status === 'completed' ? 0.5 : 1;
            const border = event.resource.status === 'in_progress' ? '2px dashed #fff' : 'none';
            return { style: { backgroundColor, opacity, border, borderRadius: '6px', padding: '2px 5px', fontSize: '0.85em', color: '#fff' } };
          }}
        />
      </div>
      
      <div style={{ marginTop: '15px', display: 'flex', gap: '15px', fontSize: '13px', color: '#666', flexWrap: 'wrap' }}>
        <strong>Estado:</strong>
        <span>🗓️ Programado</span>
        <span>🚕 En Curso (Borde Rayado)</span>
        <span>✅ Completado (Grisáceo)</span>
        <strong style={{ marginLeft: '10px' }}>Color:</strong>
        <span>Cada chofer tiene un color de fondo único.</span>
      </div>
    </div>
  );
}
