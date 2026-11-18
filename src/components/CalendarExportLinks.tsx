import React from 'react';
import { CalendarDays, ExternalLink } from 'lucide-react';
import { Event } from '../lib/types';

interface CalendarExportLinksProps {
  event: Event;
  compact?: boolean;
}

function buildEventDetails(event: Event) {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  const location = [event.venueName, event.buildingHall, event.roomNumber, event.campusArea, event.address]
    .filter(Boolean)
    .join(', ');
  const details = [
    event.description,
    event.organizerName ? `Organizer: ${event.organizerName}` : '',
    event.directionsUrl ? `Directions: ${event.directionsUrl}` : '',
    `Event page: ${window.location.origin}/events/${event.slug}`,
  ].filter(Boolean).join('\n\n');

  return { start, end, location, details };
}

export const CalendarExportLinks: React.FC<CalendarExportLinksProps> = ({ event, compact = false }) => {
  const { start, end, location, details } = buildEventDetails(event);
  const dateRange = `${start.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${end.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`;
  const googleUrl = new URL('https://calendar.google.com/calendar/render');
  googleUrl.searchParams.set('action', 'TEMPLATE');
  googleUrl.searchParams.set('text', event.title);
  googleUrl.searchParams.set('dates', dateRange);
  googleUrl.searchParams.set('details', details);
  googleUrl.searchParams.set('location', location);
  const outlookUrl = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
  outlookUrl.searchParams.set('path', '/calendar/action/compose');
  outlookUrl.searchParams.set('rru', 'addevent');
  outlookUrl.searchParams.set('subject', event.title);
  outlookUrl.searchParams.set('startdt', start.toISOString());
  outlookUrl.searchParams.set('enddt', end.toISOString());
  outlookUrl.searchParams.set('body', details);
  outlookUrl.searchParams.set('location', location);

  const baseClass = compact
    ? 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-navy-light/60 dark:bg-[#0B132B] dark:text-slate-200'
    : 'flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-navy-light/60 dark:bg-[#0B132B] dark:text-slate-200';

  return (
    <div className={compact ? 'flex flex-wrap gap-2' : 'grid grid-cols-2 gap-2'} aria-label="Add this event to your calendar">
      <a className={baseClass} href={googleUrl.toString()} target="_blank" rel="noreferrer">
        <CalendarDays className="h-4 w-4" aria-hidden="true" />
        Google Calendar
        <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
      </a>
      <a className={baseClass} href={outlookUrl.toString()} target="_blank" rel="noreferrer">
        <CalendarDays className="h-4 w-4" aria-hidden="true" />
        Outlook
        <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
      </a>
    </div>
  );
};
