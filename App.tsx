
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TimelineEvent, TimelineConfig, Language } from './types';

import { translations } from './translations';
import TimelineRenderer from './components/TimelineRenderer';
import Sidebar from './components/Sidebar';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

const DEFAULT_EVENTS: TimelineEvent[] = [
  {
    id: '1',
    title: 'Exemple: Naixement de Chronicle',
    description: 'Aquesta és una línia del temps interactiva pensada per a l\'aprenentatge.',
    startDate: '2024',
    color: '#3b82f6'
  },
  {
    id: '2',
    title: 'Edat d\'Or del Disseny',
    description: 'Un període marcat per la creativitat i les noves tecnologies educatives.',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    color: '#ef4444'
  }
];

const App: React.FC = () => {
  const [events, setEvents] = useState<TimelineEvent[]>(() => {
    const saved = localStorage.getItem('chronicle_events');
    return saved ? JSON.parse(saved) : DEFAULT_EVENTS;
  });

  const [config, setConfig] = useState<TimelineConfig>(() => {
    const saved = localStorage.getItem('chronicle_config');
    return saved ? JSON.parse(saved) : {
      orientation: 'horizontal',
      scale: 'compressed',
      language: 'ca',
      theme: 'modern',
      showMedia: true,
      scrollMode: false,
      darkMode: false,
      font: 'sans',
      barHeight: 24,
      textModeRange: 'full',
      textModePoint: 'full'
    };
  });

  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('chronicle_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('chronicle_config', JSON.stringify(config));
  }, [config]);

  const t = translations[config.language];

  const handleEditEventRequest = (event: TimelineEvent) => {
    if (isDirty && !confirm(t.unsavedChanges)) {
      return;
    }
    setEditingEvent(event);
    setIsDirty(false);
    setIsSidebarOpen(true);
  };

  const handleAddEvent = () => {
    if (isDirty && !confirm(t.unsavedChanges)) {
      return;
    }
    const newEvent: TimelineEvent = {
      id: Date.now().toString(),
      title: '',
      description: '',
      startDate: new Date().getFullYear().toString(),
      color: '#3b82f6'
    };
    setEditingEvent(newEvent);
    setIsDirty(false);
    setIsSidebarOpen(true);
  };

  const handleSaveEvent = (event: TimelineEvent) => {
    setEvents(prev => {
      const exists = prev.find(e => e.id === event.id);
      if (exists) {
        return prev.map(e => e.id === event.id ? event : e);
      }
      return [...prev, event].sort((a, b) => a.startDate.localeCompare(b.startDate));
    });
    setEditingEvent(null);
    setIsDirty(false);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setEditingEvent(null);
    setIsDirty(false);
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(events.map(e => ({
      'Títol': e.title,
      'Descripció': e.description,
      'Inici': e.startDate,
      'Final': e.endDate || '',
      'Mitjà': e.mediaUrl || '',
      'Color': e.color
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Esdeveniments");
    XLSX.writeFile(workbook, "linia_del_temps.xlsx");
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      const importedEvents: TimelineEvent[] = data.map((row: any, index) => ({
        id: `imported-${Date.now()}-${index}`,
        title: row['Títol'] || row['Title'] || '',
        description: row['Descripció'] || row['Description'] || '',
        startDate: row['Inici'] || row['Start'] || '',
        endDate: row['Final'] || row['End'] || '',
        mediaUrl: row['Mitjà'] || row['Media'] || '',
        color: row['Color'] || '#3b82f6'
      }));

      setEvents(importedEvents);
    };
    reader.readAsBinaryString(file);
  };

  const handleExportPng = async (scale: number = 2) => {
    const target = timelineRef.current?.firstChild as HTMLElement;
    if (!target) return;

    // Original dimensions and styling
    const originalWidth = target.style.width;
    const originalHeight = target.style.height;
    const originalOverflow = target.style.overflow;

    // Measure full scrollable content
    const fullWidth = target.scrollWidth;
    const fullHeight = target.scrollHeight;

    // We boost padding slightly for export to avoid cutting off text
    const padding = 60;
    const captureWidth = fullWidth + padding;
    const captureHeight = fullHeight + padding;

    // Temporarily expand target
    target.style.width = `${captureWidth}px`;
    target.style.height = `${captureHeight}px`;
    target.style.overflow = 'visible';

    const bgColor = config.darkMode ? '#0f172a' : '#ffffff';

    try {
      const canvas = await html2canvas(target, {
        scale: scale,
        useCORS: true,
        backgroundColor: bgColor,
        logging: false,
        width: captureWidth,
        height: captureHeight,
        windowWidth: captureWidth,
        windowHeight: captureHeight,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        onclone: (clonedDoc) => {
          const clonedNode = clonedDoc.getElementsByClassName(target.className)[0] as HTMLElement;
          if (clonedNode) {
            clonedNode.style.backgroundColor = bgColor;
            clonedNode.style.width = `${captureWidth}px`;
            clonedNode.style.height = `${captureHeight}px`;
            clonedNode.style.minWidth = `${captureWidth}px`;
            clonedNode.style.minHeight = `${captureHeight}px`;
            clonedNode.style.borderRadius = '0px';
            clonedNode.style.boxShadow = 'none';

            // Strip shadows from cards to avoid artifacts
            const allElements = clonedNode.getElementsByTagName('*');
            for (let i = 0; i < allElements.length; i++) {
              const el = allElements[i] as HTMLElement;
              if (el.className.includes('shadow')) {
                el.style.boxShadow = 'none';
                if (el.className.includes('border')) {
                  el.style.borderColor = config.darkMode ? '#334155' : '#cbd5e1';
                }
              }
            }
          }
        }
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.download = `chronicle-${Date.now()}.png`;
      link.href = image;
      link.click();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      // Revert styles
      target.style.width = originalWidth;
      target.style.height = originalHeight;
      target.style.overflow = originalOverflow;
    }
  };


  /* State for Settings Menu */
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  /* ... existing useEffects ... */

  /* ... existing handlers ... */

  // Close settings when clicking outside (simple version: transparent overlay)
  const SettingsOverlay = () => isSettingsOpen ? (
    <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}></div>
  ) : null;

  /* ... existing JSX ... */
  // Inside return:

  return (
    <div className={`flex h-screen overflow-hidden ${config.darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>

      {/* Settings Overlay */}
      <SettingsOverlay />

      {/* Settings Modal/Popover */}
      {isSettingsOpen && (
        <div className={`absolute top-20 right-6 z-50 w-80 p-6 rounded-2xl shadow-2xl border ${config.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span className="text-xl">⚙️</span> {t.advSettings}
            </h3>
            <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">✕</button>
          </div>

          <div className="space-y-6">
            {/* Typography */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">{t.typography}</label>
              <select
                value={config.font || 'sans'}
                onChange={(e) => setConfig({ ...config, font: e.target.value as any })}
                className={`w-full p-2 rounded-lg border bg-transparent ${config.darkMode ? 'border-slate-600' : 'border-slate-200'}`}
              >
                <option value="sans">{t.fontSans}</option>
                <option value="serif">{t.fontSerif}</option>
                <option value="mono">{t.fontMono}</option>
                <option value="handwriting">{t.fontHand}</option>
              </select>
            </div>

            {/* Bar Height */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">{t.barHeight}: {config.barHeight || 24}px</label>
              <input
                type="range"
                min="12" max="60" step="4"
                value={config.barHeight || 24}
                onChange={(e) => setConfig({ ...config, barHeight: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Text Cards: Point Events */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">{t.textCardsPoint}</label>
              <div className="text-[10px] text-slate-500 mb-1">{t.showHide}</div>
              <div className="flex flex-col gap-2">
                {['full', 'compact', 'hidden'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setConfig({ ...config, textModePoint: mode as any })}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm transition-all ${config.textModePoint === mode
                      ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium ring-1 ring-blue-500'
                      : (config.darkMode ? 'border-slate-600 hover:bg-slate-700 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-600')
                      }`}
                  >
                    <span className="text-lg">
                      {mode === 'full' ? '📄' : mode === 'compact' ? '🏷️' : '👁️'}
                    </span>
                    <span>
                      {mode === 'full' ? t.textModeFull : mode === 'compact' ? t.textModeCompact : t.textModeHidden}
                    </span>
                    {config.textModePoint === mode && <span className="ml-auto text-blue-500">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Cards: Range Events */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">{t.textCardsRange}</label>
              <div className="text-[10px] text-slate-500 mb-1">{t.showHide}</div>
              <div className="flex flex-col gap-2">
                {['full', 'compact', 'hidden'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setConfig({ ...config, textModeRange: mode as any })}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm transition-all ${config.textModeRange === mode
                      ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium ring-1 ring-blue-500'
                      : (config.darkMode ? 'border-slate-600 hover:bg-slate-700 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-600')
                      }`}
                  >
                    <span className="text-lg">
                      {mode === 'full' ? '📄' : mode === 'compact' ? '🏷️' : '👁️'}
                    </span>
                    <span>
                      {mode === 'full' ? t.textModeFull : mode === 'compact' ? t.textModeCompact : t.textModeHidden}
                    </span>
                    {config.textModeRange === mode && <span className="ml-auto text-blue-500">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <aside className={`
        ${isSidebarOpen ? 'w-80 md:w-96' : 'w-0'} 
        transition-all duration-300 ease-in-out ${config.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border-r 
        flex flex-col overflow-hidden relative shadow-xl z-20
      `}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-blue-500 flex items-center gap-3">
              <div className="p-1 bg-white shadow-sm rounded-xl border border-slate-100 dark:bg-slate-700 dark:border-slate-600">
                <img src="/assets/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
              </div>
              {t.title}
            </h1>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            >
              ✕
            </button>
          </div>

          <Sidebar
            config={config}
            setConfig={setConfig}
            events={events}
            editingEvent={editingEvent}
            onSaveEvent={handleSaveEvent}
            onCancelEdit={() => { setEditingEvent(null); setIsDirty(false); }}
            onDeleteEvent={handleDeleteEvent}
            onEditEvent={handleEditEventRequest}
            onAddEvent={handleAddEvent}
            onExportExcel={handleExportExcel}
            onImportExcel={handleImportExcel}
            onExportPng={handleExportPng}
            setIsDirty={setIsDirty}
          />
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className={`h-16 border-b ${config.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} px-6 flex items-center justify-between shadow-sm z-10 transition-colors`}>
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                title={t.title}
              >
                ☰
              </button>
            )}
            {/* Title when sidebar is closed */}
            {!isSidebarOpen && (
              <h1 className="text-xl font-bold text-blue-500 flex items-center gap-3">
                <div className="p-1 bg-white shadow-sm rounded-lg border border-slate-100 dark:bg-slate-700 dark:border-slate-600">
                  <img src="/assets/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
                </div>
                {t.title}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-4">

            {/* Language Selector (Mini) */}
            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              {['ca', 'es', 'en'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setConfig({ ...config, language: lang as any })}
                  className={`px-2 py-1 text-xs font-bold rounded-md uppercase transition-all ${config.language === lang
                    ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-300'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>

            {/* Theme Toggle (Sun/Moon) */}
            <button
              onClick={() => setConfig({ ...config, darkMode: !config.darkMode })}
              className={`p-2 rounded-full transition-all ${config.darkMode
                ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600 ring-2 ring-slate-600'
                : 'bg-orange-100 text-orange-500 hover:bg-orange-200 ring-2 ring-orange-100'
                }`}
              title={t.darkMode}
            >
              {config.darkMode ? '🌙' : '☀️'}
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`p-2 rounded-full transition-all ${config.darkMode
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 ring-2 ring-slate-600'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 ring-2 ring-slate-50'
                }`}
              title={t.advSettings}
            >
              ⚙️
            </button>

            {/* Export Actions (Grouped) */}
            <div className="flex gap-2">
              <button
                onClick={() => handleExportPng(2)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${config.darkMode
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                title={t.exportPng}
              >
                📷 <span className="hidden sm:inline">PNG</span>
              </button>
              <button
                onClick={handleExportExcel}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${config.darkMode
                  ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                title={t.exportExcel}
              >
                📥 <span className="hidden sm:inline">Excel</span>
              </button>
            </div>

          </div>
        </header>

        <div
          className={`flex-1 overflow-auto ${config.darkMode ? 'bg-slate-900' : 'bg-slate-100'} p-8 flex items-start justify-start transition-colors`}
          ref={timelineRef}
          onWheel={(e) => {
            if (config.orientation === 'horizontal' && timelineRef.current) {
              if (e.deltaY !== 0) {
                timelineRef.current.scrollLeft += e.deltaY;
              }
            }
          }}
        >
          {events.length > 0 ? (
            <TimelineRenderer
              events={events}
              config={config}
              onEditEvent={handleEditEventRequest}
            />
          ) : (
            <div className={`m-auto text-center p-12 ${config.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-2xl shadow-sm border border-dashed max-w-md`}>
              <div className="text-5xl mb-4">🎨</div>
              <h3 className={`text-xl font-bold ${config.darkMode ? 'text-slate-200' : 'text-slate-800'} mb-2`}>{t.noEvents}</h3>
              <p className="text-slate-500 mb-6">{t.helpText}</p>
              <button
                onClick={handleAddEvent}
                className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 transition-colors"
              >
                {t.addEvent}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
