
import React, { useState, useEffect } from 'react';
import { TimelineEvent, TranslationStrings, TimelineConfig } from '../types';

interface EventEditorProps {
  event: TimelineEvent;
  onSave: (event: TimelineEvent) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  t: TranslationStrings;
  setIsDirty: (dirty: boolean) => void;
  config: TimelineConfig;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b', '#000000'];

const EventEditor: React.FC<EventEditorProps> = ({ event, onSave, onCancel, onDelete, t, setIsDirty, config }) => {
  const [formData, setFormData] = useState<TimelineEvent>(event);

  useEffect(() => {
    setFormData(event);
  }, [event]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  const handleColorChange = (color: string) => {
    setFormData(prev => ({ ...prev, color }));
    setIsDirty(true);
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'startDate' | 'endDate') => {
    const value = e.target.value;
    if (value) {
      setFormData(prev => ({ ...prev, [field]: value }));
      setIsDirty(true);
    }
  };

  const inputClasses = `w-full p-2.5 rounded-lg border outline-none text-sm transition-colors ${config.darkMode
      ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-blue-500'
      : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
    }`;

  const labelClasses = "block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1";

  // Helper to check if string is a valid date for the native picker (YYYY-MM-DD)
  const getPickerValue = (val: string) => {
    const dateMatch = val.match(/^\d{4}-\d{2}-\d{2}$/);
    return dateMatch ? val : '';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-bold ${config.darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{event.title ? t.editEvent : t.addEvent}</h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5 pr-2 custom-scrollbar">
        <div>
          <label className={labelClasses}>{t.eventTitle}</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={inputClasses}
            placeholder="Ex: Descobriment d'Amèrica"
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelClasses}>{t.startDate}</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className={inputClasses}
                placeholder="1492 o 1492-10-12"
              />
              <div className="relative shrink-0">
                <input
                  type="date"
                  ref={el => {
                    // Store ref to trigger picker
                    if (el && !el.dataset.initialized) {
                      el.dataset.initialized = 'true';
                    }
                  }}
                  id="startDateDataPicker"
                  value={getPickerValue(formData.startDate)}
                  onChange={(e) => handleDatePickerChange(e, 'startDate')}
                  className="absolute opacity-0 w-0 h-0 pointer-events-none"
                  tabIndex={-1}
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('startDateDataPicker') as HTMLInputElement;
                    if (input) {
                      try {
                        input.showPicker();
                      } catch (e) {
                        // Fallback for older browsers
                        input.focus();
                        input.click();
                      }
                    }
                  }}
                  className={`p-2.5 rounded-lg border transition-colors flex items-center justify-center hover:bg-blue-50 dark:hover:bg-slate-600 ${config.darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-300'}`}
                >
                  📅
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className={labelClasses}>{t.endDate}</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="endDate"
                value={formData.endDate || ''}
                onChange={handleChange}
                className={inputClasses}
                placeholder="opcional"
              />
              <div className="relative shrink-0">
                <input
                  type="date"
                  id="endDateDataPicker"
                  value={getPickerValue(formData.endDate || '')}
                  onChange={(e) => handleDatePickerChange(e, 'endDate')}
                  className="absolute opacity-0 w-0 h-0 pointer-events-none"
                  tabIndex={-1}
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('endDateDataPicker') as HTMLInputElement;
                    if (input) {
                      try {
                        input.showPicker();
                      } catch (e) {
                        input.focus();
                        input.click();
                      }
                    }
                  }}
                  className={`p-2.5 rounded-lg border transition-colors flex items-center justify-center hover:bg-blue-50 dark:hover:bg-slate-600 ${config.darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-300'}`}
                >
                  📅
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className={labelClasses}>{t.eventDesc}</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={`${inputClasses} h-24 resize-none`}
            placeholder="Escriu una breu descripció..."
          />
        </div>

        <div>
          <label className={labelClasses}>{t.mediaUrl}</label>
          <input
            type="text"
            name="mediaUrl"
            value={formData.mediaUrl || ''}
            onChange={handleChange}
            className={inputClasses}
            placeholder="https://imatge.com/foto.jpg o YouTube"
          />
        </div>

        <div>
          <label className={`${labelClasses} mb-2`}>{t.color}</label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => handleColorChange(c)}
                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${formData.color === c ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
            <div className="relative group">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-8 h-8 p-0 rounded-full border-none outline-none cursor-pointer overflow-hidden appearance-none"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-white drop-shadow-md text-[10px]">
                🖌️
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`pt-6 border-t ${config.darkMode ? 'border-slate-700' : 'border-slate-100'} space-y-2 mt-auto`}>
        <button
          onClick={() => onSave(formData)}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-[0.98]"
        >
          {t.save}
        </button>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${config.darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {t.cancel}
          </button>
          {event.id && (
            <button
              onClick={() => onDelete(event.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${config.darkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
            >
              {t.delete}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventEditor;
