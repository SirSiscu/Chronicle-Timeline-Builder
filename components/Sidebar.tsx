
import React from 'react';
import { TimelineEvent, TimelineConfig, Language, LANGUAGES } from '../types';
import { translations } from '../translations';
import EventEditor from './EventEditor';

interface SidebarProps {
  config: TimelineConfig;
  setConfig: React.Dispatch<React.SetStateAction<TimelineConfig>>;
  events: TimelineEvent[];
  editingEvent: TimelineEvent | null;
  onSaveEvent: (event: TimelineEvent) => void;
  onCancelEdit: () => void;
  onDeleteEvent: (id: string) => void;
  onEditEvent: (event: TimelineEvent) => void;
  onAddEvent: () => void;
  onExportExcel: () => void;
  onImportExcel: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportPng: (scale?: number) => void;
  setIsDirty: (dirty: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  config, setConfig, events, editingEvent, onSaveEvent,
  onCancelEdit, onDeleteEvent, onEditEvent, onAddEvent,
  onExportExcel, onImportExcel, onExportPng, setIsDirty
}) => {
  const t = translations[config.language];

  if (editingEvent) {
    return (
      <EventEditor
        event={editingEvent}
        onSave={onSaveEvent}
        onCancel={onCancelEdit}
        onDelete={onDeleteEvent}
        t={t}
        setIsDirty={setIsDirty}
        config={config}
      />
    );
  }

  const btnBase = `p-2 rounded-lg border text-sm text-center transition-all flex items-center justify-center gap-2`;
  const btnActive = config.darkMode
    ? 'bg-blue-900/50 border-blue-500 text-blue-200 font-bold'
    : 'bg-blue-50 border-blue-500 text-blue-700 font-bold';
  const btnInactive = config.darkMode
    ? 'border-slate-700 text-slate-400 hover:bg-slate-700'
    : 'border-slate-200 text-slate-600 hover:bg-slate-50';

  return (
    <div className="flex-1 overflow-y-auto space-y-8 pb-10 custom-scrollbar">
      {/* Visual Settings Section */}
      <section>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">{t.orientation} & {t.scale}</h3>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setConfig({ ...config, orientation: 'horizontal' })}
            className={`${btnBase} ${config.orientation === 'horizontal' ? btnActive : btnInactive}`}
          >
            ↔ {t.horizontal}
          </button>
          <button
            onClick={() => setConfig({ ...config, orientation: 'vertical' })}
            className={`${btnBase} ${config.orientation === 'vertical' ? btnActive : btnInactive}`}
          >
            ↕ {t.vertical}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setConfig({ ...config, scale: 'proportional' })}
            className={`${btnBase} ${config.scale === 'proportional' ? btnActive : btnInactive}`}
          >
            {t.proportional}
          </button>
          <button
            onClick={() => setConfig({ ...config, scale: 'compressed' })}
            className={`${btnBase} ${config.scale === 'compressed' ? btnActive : btnInactive}`}
          >
            {t.compressed}
          </button>
        </div>

        <div className="space-y-2">
          <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${config.darkMode ? 'border-slate-700 bg-slate-800/50 hover:bg-slate-700' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'}`}>
            <input
              type="checkbox"
              checked={config.scrollMode}
              onChange={(e) => setConfig({ ...config, scrollMode: e.target.checked })}
              className="w-4 h-4 text-blue-600"
            />
            <span className={`text-sm font-medium ${config.darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t.scrollMode}</span>
          </label>


        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Dades</h3>
        <div className="grid grid-cols-1 gap-2">
          <label className={`w-full text-center p-2 rounded-lg border text-xs cursor-pointer transition-colors block flex items-center justify-center gap-2 ${config.darkMode ? 'bg-blue-900/30 border-blue-800 text-blue-400 hover:bg-blue-900/50' : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'}`}>
            📤 {t.importExcel}
            <input type="file" accept=".xlsx" onChange={onImportExcel} className="hidden" />
          </label>
        </div>
      </section>

      {/* Event List Section */}
      <section>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Esdeveniments ({events.length})</h3>

        {/* New Add Event Button in Sidebar */}
        <button
          onClick={onAddEvent}
          className={`w-full mb-3 py-2 px-4 rounded-lg font-bold text-white shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 ${config.darkMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          <span className="text-lg leading-none mb-0.5">+</span> {translations[config.language].addEvent}
        </button>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {events.map(e => (
            <button
              key={e.id}
              onClick={() => onEditEvent(e)}
              className={`w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3 group ${config.darkMode ? 'border-slate-700/50 hover:border-blue-500/50 hover:bg-blue-900/20' : 'border-slate-100 hover:border-blue-300 hover:bg-blue-50'}`}
            >
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: e.color }}></div>
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm truncate ${config.darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{e.title || 'Sense títol'}</div>
                <div className="text-xs text-slate-500">{e.startDate}</div>
              </div>
              <span className="opacity-0 group-hover:opacity-100 text-blue-500 text-xs transition-opacity">✎</span>
            </button>
          ))}
        </div>
      </section>
      {/* Credits Section */}
      <footer className="pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className={`text-[10px] ${config.darkMode ? 'text-slate-500' : 'text-slate-400'} text-center space-y-1`}>
          <p>Creat per <span className="font-semibold">Francesc Sala Carbó</span></p>
          <div className="flex justify-center gap-3">
            <a href="https://github.com/SirSiscu" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors">GitHub</a>
            <a href="https://buymeacoffee.com/francescsala" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors">Buy Me a Coffee</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Sidebar;
