
import React, { useMemo, useState } from 'react';
import { TimelineEvent, TimelineConfig } from '../types';
import { parseFlexibleDate, formatDisplayDate, getYouTubeEmbedUrl } from '../dateUtils';

interface TimelineRendererProps {
  events: TimelineEvent[];
  config: TimelineConfig;
  onEditEvent: (event: TimelineEvent) => void;
}

const TimelineRenderer: React.FC<TimelineRendererProps> = ({ events, config, onEditEvent }) => {
  const isHorizontal = config.orientation === 'horizontal';
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => parseFlexibleDate(a.startDate) - parseFlexibleDate(b.startDate));
  }, [events]);

  const { minYear, maxYear, yearRange } = useMemo(() => {
    if (sortedEvents.length === 0) return { minYear: 0, maxYear: 0, yearRange: 1 };
    const startYears = sortedEvents.map(e => parseFlexibleDate(e.startDate));
    const endYears = sortedEvents.map(e => e.endDate ? parseFlexibleDate(e.endDate) : parseFlexibleDate(e.startDate));
    const min = Math.min(...startYears);
    const max = Math.max(...endYears);
    const range = max - min || 1;
    return { minYear: min, maxYear: max, yearRange: range };
  }, [sortedEvents]);

  // Use a fixed padding percentage to ensure markers aren't cut off at the edges
  const AXIS_PADDING = 5; // 5%

  const getPercent = (dateStr: string | number) => {
    if (config.scale === 'compressed') {
      const targetDate = typeof dateStr === 'string' ? dateStr : dateStr.toString();
      const index = sortedEvents.findIndex(e => e.id === sortedEvents.find(ev => ev.startDate === targetDate)?.id);
      const factor = sortedEvents.length > 1 ? index / (sortedEvents.length - 1) : 0.5;
      return AXIS_PADDING + (factor * (100 - 2 * AXIS_PADDING));
    }
    // Proportional Mode
    const year = typeof dateStr === 'string' ? parseFlexibleDate(dateStr) : dateStr;
    const factor = (year - minYear) / yearRange;
    return AXIS_PADDING + (factor * (100 - 2 * AXIS_PADDING));
  };

  // Generate nice integer ticks for the axis
  const timeTicks = useMemo(() => {
    if (config.scale === 'compressed') return [];
    const targetTickCount = Math.max(5, Math.min(10, Math.floor(yearRange)));
    const rawStep = yearRange / targetTickCount;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const residual = rawStep / magnitude;
    let step = magnitude;
    if (residual > 5) step = 10 * magnitude;
    else if (residual > 2) step = 5 * magnitude;
    else if (residual > 1) step = 2 * magnitude;
    step = Math.max(1, step);

    const startTick = Math.floor(minYear / step) * step;
    const endTick = Math.ceil(maxYear / step) * step;
    const ticks: number[] = [];
    for (let t = startTick; t <= endTick; t += step) {
      if (t >= minYear - step / 2 && t <= maxYear + step / 2) {
        ticks.push(t);
      }
    }
    return ticks;
  }, [minYear, maxYear, yearRange, config.scale]);

  // Stack range bars in lanes to avoid overlap
  const eventLanes = useMemo(() => {
    if (config.scale === 'compressed') return sortedEvents.map(() => 0);
    const lanes: number[] = new Array(sortedEvents.length).fill(0);
    const tracks: { end: number }[] = [];
    sortedEvents.forEach((e, idx) => {
      if (!e.endDate) return;
      const start = parseFlexibleDate(e.startDate);
      const end = parseFlexibleDate(e.endDate);
      let trackId = 0;
      while (true) {
        // Reduced buffer to allow tight packing, or usage of strict inequality
        // Using 0 buffer allows "touching" events to share a track if logic is correct

        // Strict Less-Than or Equal check: if trackEnd <= currentStart, it fits.
        // tracks[trackId].end represents the *occupied* space.
        if (!tracks[trackId] || tracks[trackId].end <= start) {
          tracks[trackId] = { end: Math.max(tracks[trackId]?.end || -Infinity, end) };
          lanes[idx] = trackId;
          break;
        }
        trackId++;
      }
    });
    return lanes;
  }, [sortedEvents, config.scale, yearRange]);

  // --- PIXEL-BASED COLLISION LOGIC ---

  // 1. Calculate Base Timeline Length (Pixels)
  const timelineLengthPx = useMemo(() => {
    const baseLength = isHorizontal ? 1200 : 800; // Base container size
    if (config.scrollMode) {
      const perEvent = isHorizontal ? 250 : 200;
      return Math.max(isHorizontal ? 1600 : 1200, sortedEvents.length * perEvent);
    }
    return baseLength;
  }, [config.scrollMode, sortedEvents.length, isHorizontal]);

  // 2. Calculate Collision Levels using Pixels
  const cardLevels = useMemo(() => {
    const levels: number[] = new Array(sortedEvents.length).fill(0);
    const levelEndsPx: Record<string, number> = {};
    const cardSizePx = isHorizontal ? 320 : 180;

    sortedEvents.forEach((e, idx) => {
      const percentPos = getPercent(e.startDate);
      const startPx = (percentPos / 100) * timelineLengthPx;

      const side = idx % 2; // 0 or 1
      let stackLevel = 0;

      while (true) {
        const key = `${side}-${stackLevel}`;
        const lastEndPx = levelEndsPx[key] || -99999;

        if (startPx > lastEndPx + 50) {
          levelEndsPx[key] = startPx + cardSizePx;
          levels[idx] = stackLevel;
          break;
        }
        stackLevel++;
        if (stackLevel > 50) {
          levels[idx] = 50;
          break;
        }
      }
    });
    return levels;
  }, [sortedEvents, isHorizontal, timelineLengthPx, config.scale, yearRange, minYear]);

  const maxLane = Math.max(...eventLanes, 0);
  const maxStackLevel = Math.max(...cardLevels, 0);

  const containerStyle = useMemo(() => {
    const baseH = 600;
    const baseW = 800;
    const extraPerLevel = 160;
    const depthExpansion = Math.max(0, maxStackLevel - 1) * extraPerLevel;

    // Dynamic Bar Height expansion for Range Events
    const barHeight = config.barHeight || 24;
    const laneSpacing = 8;
    // Base height needs to accommodate range lanes if proportional
    const rangeLaneHeight = config.scale === 'proportional' ? (maxLane + 1) * (barHeight + laneSpacing) : 0;

    // Add extra space if range lanes are tall
    const totalContentHeight = Math.max(baseH, rangeLaneHeight + 300);

    const finalWidth = isHorizontal ? timelineLengthPx : (baseW + depthExpansion);
    const finalHeight = isHorizontal ? (totalContentHeight + depthExpansion) : timelineLengthPx;

    return {
      width: `${finalWidth}px`,
      height: `${finalHeight}px`,
      minWidth: `${finalWidth}px`,
      minHeight: `${finalHeight}px`,
    };
  }, [timelineLengthPx, isHorizontal, maxStackLevel, maxLane, config.scale, config.barHeight]);

  // Typography Class Map
  const fontClass = {
    'sans': 'font-sans',
    'serif': 'font-serif',
    'mono': 'font-mono',
    'handwriting': 'font-[Gaegu]' // Assuming Gaegu is loaded or falls back to cursive
  }[config.font || 'sans'] || 'font-sans';

  return (
    <div
      className={`relative rounded-3xl shadow-lg border transition-all duration-700 py-10 px-10 m-auto ${config.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} ${fontClass}`}
      style={containerStyle}
    >
      {/* Main Axis Line */}
      <div className={`absolute shadow-inner rounded-full ${config.darkMode ? 'bg-slate-700' : 'bg-slate-200'
        } ${isHorizontal ? 'h-1.5 left-0 right-0 top-1/2 -translate-y-1/2' : 'w-1.5 top-0 bottom-0 left-1/2 -translate-x-1/2'}`}></div>

      {/* Grid Markers */}
      {config.scale === 'proportional' && (
        <div className={`absolute pointer-events-none inset-0 flex ${isHorizontal ? 'flex-row' : 'flex-col'}`}>
          {timeTicks.map(year => {
            const pos = getPercent(year);
            if (pos < 0 || pos > 100) return null;
            return (
              <div
                key={year}
                className="absolute flex items-center justify-center opacity-40"
                style={{
                  left: isHorizontal ? `${pos}%` : '0',
                  top: isHorizontal ? '0' : `${pos}%`,
                  height: isHorizontal ? '100%' : '1px',
                  width: isHorizontal ? '1px' : '100%',
                  transform: isHorizontal ? 'translateX(-50%)' : 'translateY(-50%)'
                }}
              >
                <div className={`${isHorizontal ? 'w-full h-full' : 'h-full w-full'} ${config.darkMode ? 'bg-slate-500' : 'bg-slate-400'}`}></div>
                <span className={`absolute text-[10px] font-bold font-mono transition-colors whitespace-nowrap ${config.darkMode ? 'text-slate-400' : 'text-slate-600'} ${isHorizontal ? 'top-2 mt-4' : 'left-full ml-2'}`}>
                  {Math.round(year)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* LAYER 0: Connector Lines (Decoupled) */}
      {sortedEvents.map((event, index) => {
        const startPos = getPercent(event.startDate);
        const isRange = !!event.endDate && config.scale === 'proportional';
        const isOdd = index % 2 === 0;

        let anchorOffsetPixels = 0;
        if (isRange) {
          const lane = eventLanes[index];
          const barHeight = config.barHeight || 24;
          const laneSpacing = 8;
          const totalStackHeight = (maxLane + 1) * (barHeight + laneSpacing) - laneSpacing;
          const currentLaneOffset = lane * (barHeight + laneSpacing);
          anchorOffsetPixels = -totalStackHeight / 2 + currentLaneOffset;
        }

        const stackLevel = cardLevels[index] || 0;
        const levelOffsetPx = stackLevel * 160;
        const baseDistance = 56;
        const totalCardDistance = baseDistance + levelOffsetPx;

        const cardSign = isOdd ? -1 : 1;
        const cardEdgePos = cardSign * totalCardDistance;
        const anchorPos = isRange ? anchorOffsetPixels : 0;
        const length = Math.abs(cardEdgePos - anchorPos);
        const topOfLine = Math.min(cardEdgePos, anchorPos);
        const isHovered = hoveredEventId === event.id;

        // Visibility Check
        const textMode = isRange ? (config.textModeRange || 'full') : (config.textModePoint || 'full');
        const isHiddenMode = textMode === 'hidden';
        const finalOpacity = (isHiddenMode && !isHovered) ? 0 : (isHovered ? 1 : 0.6);

        return (
          <div
            key={`connector-${event.id}`}
            className={`absolute z-10 pointer-events-none transition-all duration-300 ease-out`}
            style={{
              backgroundColor: event.color,
              opacity: finalOpacity,
              transformOrigin: isHorizontal ? 'center top' : 'left center',
              left: isHorizontal ? `${startPos}%` : '50%',
              top: isHorizontal ? '50%' : `${startPos}%`,
              width: isHorizontal ? (isHovered ? '2px' : '1px') : `${length}px`,
              height: isHorizontal ? `${length}px` : (isHovered ? '2px' : '1px'),
              transform: isHorizontal
                ? `translateX(-50%) translateY(${topOfLine}px)`
                : `translateY(-50%) translateX(${topOfLine}px)`
            }}
          />
        );
      })}

      {/* LAYER 1: Range Bars */}
      {config.scale === 'proportional' && events.filter(e => e.endDate).map((event) => {
        const idx = sortedEvents.findIndex(e => e.id === event.id);
        if (idx === -1) return null;

        const startPos = getPercent(event.startDate);
        const endPos = getPercent(event.endDate || event.startDate);
        const widthPercent = Math.max(0.5, endPos - startPos);

        const lane = eventLanes[idx];
        const barHeight = config.barHeight || 24;
        const laneSpacing = 8;
        const totalStackHeight = (maxLane + 1) * (barHeight + laneSpacing) - laneSpacing;
        const currentLaneOffset = lane * (barHeight + laneSpacing);
        const centeredOffset = -totalStackHeight / 2 + currentLaneOffset;

        const isHovered = hoveredEventId === event.id;

        return (
          <div
            key={`bar-${event.id}`}
            className={`absolute rounded-md transition-all duration-300 cursor-pointer flex items-center justify-center overflow-hidden z-20 border ${config.darkMode ? 'border-slate-800' : 'border-white'}
              ${isHovered ? 'ring-2 ring-offset-2 ring-blue-400 brightness-110' : 'shadow-sm opacity-90'}
            `}
            style={{
              backgroundColor: event.color,
              left: isHorizontal ? `${startPos}%` : '50%',
              top: isHorizontal ? '50%' : `${startPos}%`,
              width: isHorizontal ? `${widthPercent}%` : `${barHeight}px`,
              height: isHorizontal ? `${barHeight}px` : `${widthPercent}%`,
              transform: isHorizontal
                ? `translateY(${centeredOffset}px)`
                : `translateX(${centeredOffset}px)`,
            }}
            onClick={() => onEditEvent(event)}
            onMouseEnter={() => setHoveredEventId(event.id)}
            onMouseLeave={() => setHoveredEventId(null)}
          >
            {/* Show title inside bar if tall enough, otherwise hide or tooltip */}
            {barHeight >= 20 && (
              <span
                className={`text-[10px] font-bold text-white px-2 truncate pointer-events-none drop-shadow-md select-none ${!isHorizontal ? '[writing-mode:vertical-rl] rotate-180' : ''}`}
              >
                {event.title}
              </span>
            )}
          </div>
        );
      })}

      {/* Events Rendering */}
      {sortedEvents.map((event, index) => {
        const startPos = getPercent(event.startDate);
        const isRange = !!event.endDate && config.scale === 'proportional';

        // --- TEXT MODE LOGIC ---
        const textMode = isRange ? (config.textModeRange || 'full') : (config.textModePoint || 'full');
        const isHidden = textMode === 'hidden';
        const isCompact = textMode === 'compact';

        const isOdd = index % 2 === 0;
        const ytUrl = event.mediaUrl ? getYouTubeEmbedUrl(event.mediaUrl) : null;
        const stackLevel = cardLevels[index] || 0;
        const levelOffsetPx = stackLevel * 160;
        const baseDistance = 56;
        const totalDistance = baseDistance + levelOffsetPx;

        let cardAlignmentClasses = '';
        if (isHorizontal) {
          if (startPos < 15) cardAlignmentClasses = 'left-0 translate-x-0';
          else if (startPos > 85) cardAlignmentClasses = 'right-0 translate-x-0 left-auto';
          else cardAlignmentClasses = 'left-1/2 -translate-x-1/2';
        } else {
          if (startPos < 15) cardAlignmentClasses = 'top-0 translate-y-0';
          else if (startPos > 85) cardAlignmentClasses = 'bottom-0 translate-y-0 top-auto';
          else cardAlignmentClasses = 'top-1/2 -translate-y-1/2';
        }

        const isHovered = hoveredEventId === event.id;

        return (
          <div
            key={event.id}
            className={`absolute transition-all duration-500 ease-out z-30 ${isHovered ? '!z-50' : ''}`}
            style={{
              left: isHorizontal ? `${startPos}%` : '50%',
              top: isHorizontal ? '50%' : `${startPos}%`,
              transform: isHorizontal ? 'translateY(-50%)' : 'translateX(-50%)',
              width: '0px', height: '0px'
            }}
            onMouseEnter={() => setHoveredEventId(event.id)}
            onMouseLeave={() => setHoveredEventId(null)}
          >
            {/* Point Marker */}
            {!isRange && (
              <div
                className={`absolute w-5 h-5 rounded-full border-4 shadow-md z-30 cursor-pointer transition-all -translate-x-1/2 -translate-y-1/2 ${config.darkMode ? 'border-slate-800' : 'border-white'}
                   ${isHovered ? 'scale-125 ring-2 ring-offset-2 ring-blue-400' : 'hover:scale-125'}
                `}
                style={{ backgroundColor: event.color }}
                onClick={() => onEditEvent(event)}
              ></div>
            )}

            {/* Content Card */}
            <div
              className={`
                absolute rounded-xl shadow-2xl border p-4 w-72 transition-all duration-300
                group cursor-pointer z-40
                ${config.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}
                ${cardAlignmentClasses}
                ${isHovered
                  ? 'scale-105 opacity-100 ring-2 ring-blue-400'
                  : (isHidden ? 'scale-90 opacity-0 pointer-events-none' : 'scale-100 opacity-90')
                }
              `}
              style={{
                ...(isHorizontal ? {
                  [isOdd ? 'bottom' : 'top']: `${totalDistance}px`,
                  marginTop: '0', marginBottom: '0'
                } : {
                  [isOdd ? 'right' : 'left']: `${totalDistance}px`,
                  marginLeft: '0', marginRight: '0'
                })
              }}
              onClick={() => onEditEvent(event)}
            >
              {/* Media - Hide in Compact Mode */}
              {!isCompact && config.showMedia && event.mediaUrl && (
                <div className={`mb-3 rounded-lg overflow-hidden h-32 relative ${config.darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
                  {ytUrl ? (
                    <iframe src={ytUrl} className="w-full h-full border-none" title="Video" />
                  ) : (
                    <img src={event.mediaUrl} className="w-full h-full object-cover" alt={event.title} />
                  )}
                </div>
              )}

              <div className="text-[10px] font-bold tracking-tight uppercase mb-1" style={{ color: event.color }}>
                {formatDisplayDate(event.startDate)} {event.endDate ? `— ${formatDisplayDate(event.endDate)}` : ''}
              </div>
              <h4 className={`font-bold leading-tight mb-1 group-hover:text-blue-500 transition-colors ${config.darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                {event.title || 'Sense Títol'}
              </h4>

              {/* Description - Hide in Compact Mode */}
              {!isCompact && (
                <p className={`text-xs line-clamp-3 leading-relaxed transition-colors ${config.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {event.description}
                </p>
              )}
            </div>
          </div>
        );
      })}

    </div>
  );
};

export default TimelineRenderer;
