import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import {
  Database, Sparkles, Shield, Cpu, Network, MessageSquare, Download,
  CheckCircle, AlertTriangle, Eye, EyeOff, Layers, Activity, Copy,
  ArrowRight, RefreshCw, Trash2, BookOpen, Terminal, ChevronRight, Lock,
  Link, Check, Search, Table
} from 'lucide-react';
import TableStudio from './TableStudio';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F', '#FFBB28', '#FF8042'];

// Animated background component
const AnimatedBackground = () => {
  useEffect(() => {
    const createDrop = () => {
      const drop = document.createElement('div');
      const size = Math.random() * 30 + 10;
      drop.style.width = `${size}px`;
      drop.style.height = `${size}px`;
      drop.style.left = `${Math.random() * 100}%`;
      drop.style.animationDuration = `${Math.random() * 15 + 8}s`;
      drop.style.animationDelay = `${Math.random() * 5}s`;
      drop.classList.add('animate-drop');
      const bgContainer = document.getElementById('animated-bg');
      if (bgContainer) {
        bgContainer.appendChild(drop);
      }
      setTimeout(() => drop.remove(), 20000);
    };
    const interval = setInterval(createDrop, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div id="animated-bg" className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-gradient-to-br from-gray-950 via-black to-gray-950">
      <style>{`
        .animate-drop {
          position: absolute;
          top: -50px;
          background: radial-gradient(circle at 30% 30%, rgba(168, 85, 247, 0.35), rgba(255,255,255,0.02));
          border-radius: 50%;
          filter: blur(4px);
          box-shadow: 0 0 25px rgba(168, 85, 247, 0.15);
          animation: fall linear infinite;
        }
        @keyframes fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 0.5; }
          80% { opacity: 0.25; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

const GlassCard = ({ children, className = '' }) => (
  <div className={`bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/70 transition-all duration-300 hover:border-white/20 ${className}`}>
    {children}
  </div>
);

// Rich Markdown Formatter for Enterprise AI Responses
const MarkdownViewer = ({ content }) => {
  if (!content) return null;
  return (
    <div className="markdown-content text-xs md:text-sm text-gray-200 leading-relaxed font-sans space-y-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-base md:text-lg font-bold text-white border-b border-white/10 pb-2 mb-3 mt-4 flex items-center gap-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm md:text-base font-bold text-purple-300 mb-2 mt-4 flex items-center gap-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs md:text-sm font-semibold text-purple-200 mb-2 mt-3 flex items-center gap-2">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="mb-2.5 leading-relaxed text-gray-300">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-outside space-y-1.5 mb-3 text-gray-300 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-outside space-y-1.5 mb-3 text-gray-300 pl-5">{children}</ol>,
          li: ({ children }) => <li className="text-gray-300 leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
          em: ({ children }) => <em className="text-gray-300 italic">{children}</em>,
          hr: () => <hr className="my-5 border-white/10" />,
          code: ({ className, children, ...props }) => {
            const codeString = String(children || '').replace(/\n$/, '');
            const isMultiLine = codeString.includes('\n') || (className && className.includes('language-'));
            
            if (isMultiLine) {
              return (
                <div className="my-3 rounded-xl overflow-hidden border border-white/10 bg-black/80 shadow-lg">
                  <div className="bg-white/5 px-3 py-1.5 border-b border-white/10 flex items-center justify-between text-[11px] font-mono text-gray-400">
                    <span className="text-purple-300 font-semibold flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-purple-400" />
                      {className ? className.replace('language-', '').toUpperCase() : 'SQL CODE'}
                    </span>
                    <button
                      onClick={() => navigator.clipboard.writeText(codeString)}
                      className="text-gray-400 hover:text-white bg-white/5 px-2 py-0.5 rounded text-[10px] transition"
                    >
                      Copy Snippet
                    </button>
                  </div>
                  <pre className="p-3.5 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {codeString}
                  </pre>
                </div>
              );
            }
            return (
              <code className="font-mono text-[11px] bg-white/10 text-purple-300 px-1.5 py-0.5 rounded border border-white/10 font-semibold" {...props}>
                {children}
              </code>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 rounded-xl border border-white/15 bg-black/60 shadow-xl">
              <table className="w-full text-xs font-mono border-collapse divide-y divide-white/10">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-white/5 text-purple-300 font-semibold">{children}</thead>,
          th: ({ children }) => <th className="border-b border-white/10 p-3 text-left font-bold text-purple-300 uppercase tracking-wider text-[11px]">{children}</th>,
          tbody: ({ children }) => <tbody className="divide-y divide-white/5">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-white/5 transition-colors">{children}</tr>,
          td: ({ children }) => <td className="p-3 text-gray-300 text-xs border-b border-white/5">{children}</td>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-purple-500 bg-purple-950/25 pl-4 py-2.5 my-3 text-xs text-purple-200 rounded-r-xl italic">
              {children}
            </blockquote>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

// Enhanced Interactive ERD Visualizer Component
const ERDVisualizer = ({ erdData, onSelectPrompt }) => {
  const containerRef = React.useRef(null);
  const [lines, setLines] = useState([]);
  const [hoveredRel, setHoveredRel] = useState(null);
  const [selectedRel, setSelectedRel] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [viewMode, setViewMode] = useState('diagram'); // 'diagram' | 'matrix'
  const [copiedRel, setCopiedRel] = useState(null);

  const activeRel = hoveredRel || selectedRel;

  // Compute lookup maps
  const fkMap = useMemo(() => {
    const map = {};
    if (!erdData?.relationships) return map;
    erdData.relationships.forEach((rel) => {
      const key = `${rel.from_table}.${rel.from_column}`;
      map[key] = rel;
    });
    return map;
  }, [erdData]);

  const refMap = useMemo(() => {
    const map = {};
    if (!erdData?.relationships) return map;
    erdData.relationships.forEach((rel) => {
      const key = `${rel.to_table}.${rel.to_column}`;
      if (!map[key]) map[key] = [];
      map[key].push(rel);
    });
    return map;
  }, [erdData]);

  // Recalculate SVG connector lines between columns
  const updateLines = useCallback(() => {
    if (!containerRef.current || !erdData?.relationships || viewMode !== 'diagram') {
      setLines([]);
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const computedLines = [];

    erdData.relationships.forEach((rel, idx) => {
      const fromColEl = document.getElementById(`erd-col-${rel.from_table}-${rel.from_column}`);
      const toColEl = document.getElementById(`erd-col-${rel.to_table}-${rel.to_column}`);
      const fromTableEl = document.getElementById(`erd-table-${rel.from_table}`);
      const toTableEl = document.getElementById(`erd-table-${rel.to_table}`);

      if (!fromTableEl || !toTableEl) return;

      const fRect = (fromColEl || fromTableEl).getBoundingClientRect();
      const tRect = (toColEl || toTableEl).getBoundingClientRect();

      // Check relative horizontal placement
      const isFromLeft = fRect.left < tRect.left;
      const x1 = isFromLeft ? (fRect.right - containerRect.left) : (fRect.left - containerRect.left);
      const y1 = (fRect.top + fRect.height / 2) - containerRect.top;
      const x2 = isFromLeft ? (tRect.left - containerRect.left) : (tRect.right - containerRect.left);
      const y2 = (tRect.top + tRect.height / 2) - containerRect.top;

      const dx = Math.abs(x2 - x1);
      const curveOffset = Math.max(dx * 0.45, 50);
      const cx1 = isFromLeft ? x1 + curveOffset : x1 - curveOffset;
      const cx2 = isFromLeft ? x2 - curveOffset : x2 + curveOffset;

      computedLines.push({
        id: idx,
        rel,
        d: `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`,
        x1, y1, x2, y2,
        midX: (x1 + x2) / 2,
        midY: (y1 + y2) / 2,
        isFromLeft
      });
    });

    setLines(computedLines);
  }, [erdData, viewMode]);

  useEffect(() => {
    const timer = setTimeout(updateLines, 120);
    window.addEventListener('resize', updateLines);
    window.addEventListener('scroll', updateLines, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateLines);
      window.removeEventListener('scroll', updateLines, true);
    };
  }, [updateLines, erdData, filterText, viewMode]);

  const copyJoinSQL = (rel, e) => {
    e?.stopPropagation();
    const sql = `SELECT * FROM ${rel.from_table} JOIN ${rel.to_table} ON ${rel.from_table}.${rel.from_column} = ${rel.to_table}.${rel.to_column};`;
    navigator.clipboard.writeText(sql);
    setCopiedRel(`${rel.from_table}-${rel.from_column}`);
    setTimeout(() => setCopiedRel(null), 2000);
  };

  if (!erdData || !erdData.tables || erdData.tables.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400 font-mono text-sm">
        <Network className="w-8 h-8 mx-auto mb-2 opacity-40 text-purple-400" />
        No schema tables detected. Connect a database with active tables to view ERD.
      </div>
    );
  }

  const filteredTables = erdData.tables.filter((t) =>
    t.name.toLowerCase().includes(filterText.toLowerCase()) ||
    t.columns.some((c) => c.name.toLowerCase().includes(filterText.toLowerCase()))
  );

  return (
    <div className="space-y-6 select-none">
      {/* Header bar with controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Network className="w-4 h-4 text-purple-400" />
            Interactive Entity Relationship Diagram (ERD)
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Hover or click any foreign key to trace relationships across tables
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search table/column filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filter tables..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 w-36 sm:w-44"
            />
          </div>

          {/* View toggle */}
          <div className="bg-white/5 border border-white/10 p-0.5 rounded-lg flex text-xs">
            <button
              onClick={() => setViewMode('diagram')}
              className={`px-2.5 py-1 rounded-md transition ${viewMode === 'diagram' ? 'bg-purple-600 text-white shadow font-semibold' : 'text-gray-400 hover:text-white'}`}
            >
              Visual Flow
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-2.5 py-1 rounded-md transition ${viewMode === 'matrix' ? 'bg-purple-600 text-white shadow font-semibold' : 'text-gray-400 hover:text-white'}`}
            >
              Joins Table
            </button>
          </div>

          <span className="text-xs font-mono bg-purple-500/10 border border-purple-500/30 text-purple-300 px-2.5 py-1 rounded-full">
            {erdData.tables.length} Tables · {erdData.relationships?.length || 0} Relations
          </span>
        </div>
      </div>

      {/* Prominent Relationship Flow Ribbon */}
      {erdData.relationships && erdData.relationships.length > 0 && (
        <div className="bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-black/50 border border-blue-500/30 rounded-xl p-3.5 shadow-lg shadow-purple-950/20">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-mono uppercase text-blue-300 flex items-center gap-1.5 font-bold tracking-wider">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Detected Relationships & Foreign Key Links
            </h4>
            <span className="text-[11px] text-gray-400 font-sans">
              Click any link to highlight & generate query
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {erdData.relationships.map((rel, idx) => {
              const isRelActive =
                activeRel &&
                activeRel.from_table === rel.from_table &&
                activeRel.from_column === rel.from_column &&
                activeRel.to_table === rel.to_table &&
                activeRel.to_column === rel.to_column;
              const isCopied = copiedRel === `${rel.from_table}-${rel.from_column}`;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredRel(rel)}
                  onMouseLeave={() => setHoveredRel(null)}
                  onClick={() => setSelectedRel(selectedRel === rel ? null : rel)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isRelActive
                      ? 'bg-purple-900/40 border-cyan-400/80 ring-2 ring-cyan-400/30 shadow-md shadow-cyan-500/20'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-purple-400/40'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-mono min-w-0">
                    {/* Source / Foreign Key Side */}
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1 rounded font-bold">FK</span>
                      <span className="text-cyan-300 font-semibold truncate">{rel.from_table}.{rel.from_column}</span>
                    </div>

                    {/* Cardinality Connector */}
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 shrink-0 px-1.5 py-0.5 rounded bg-black/40 border border-white/5">
                      <span className="text-cyan-400 font-bold">N</span>
                      <ArrowRight className="w-3 h-3 text-purple-400" />
                      <span className="text-purple-400 font-bold">1</span>
                    </div>

                    {/* Target / Primary Key Side */}
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1 rounded font-bold">PK</span>
                      <span className="text-purple-300 font-semibold truncate">{rel.to_table}.{rel.to_column}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => copyJoinSQL(rel, e)}
                      title="Copy SQL JOIN snippet"
                      className="text-[11px] p-1 bg-white/5 hover:bg-white/20 text-gray-300 rounded border border-white/10 hover:text-white transition"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPrompt(`Write a SQL query joining ${rel.from_table} and ${rel.to_table} on ${rel.from_table}.${rel.from_column} = ${rel.to_table}.${rel.to_column} to view matching records`);
                      }}
                      className="text-[10px] font-sans bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/30 px-2 py-0.5 rounded transition"
                    >
                      + Query
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Diagram Canvas View */}
      {viewMode === 'diagram' ? (
        <div ref={containerRef} className="relative min-h-[360px]">
          {/* SVG Connector Lines Overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
            <defs>
              <linearGradient id="erd-gradient-active" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
              <linearGradient id="erd-gradient-idle" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0891b2" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#7e22ce" stopOpacity="0.4" />
              </linearGradient>
              <filter id="erd-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {lines.map((line) => {
              const isHighlighted =
                activeRel &&
                activeRel.from_table === line.rel.from_table &&
                activeRel.from_column === line.rel.from_column &&
                activeRel.to_table === line.rel.to_table &&
                activeRel.to_column === line.rel.to_column;

              return (
                <g key={line.id} className="transition-all duration-300">
                  {/* Background path for hover detection & wider hit area */}
                  <path
                    d={line.d}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="18"
                    className="cursor-pointer pointer-events-auto"
                    onMouseEnter={() => setHoveredRel(line.rel)}
                    onMouseLeave={() => setHoveredRel(null)}
                    onClick={() => setSelectedRel(selectedRel === line.rel ? null : line.rel)}
                  />

                  {/* Visible Curve */}
                  <path
                    d={line.d}
                    fill="none"
                    stroke={isHighlighted ? "url(#erd-gradient-active)" : "url(#erd-gradient-idle)"}
                    strokeWidth={isHighlighted ? "3" : "1.75"}
                    strokeDasharray={isHighlighted ? "6 3" : "none"}
                    filter={isHighlighted ? "url(#erd-glow)" : undefined}
                    className="transition-all duration-200"
                  />

                  {/* Start Socket Dot (FK Side) */}
                  <circle
                    cx={line.x1}
                    cy={line.y1}
                    r={isHighlighted ? 4.5 : 3.5}
                    fill="#22d3ee"
                    className="shadow"
                  />

                  {/* End Socket Dot (PK Side) */}
                  <circle
                    cx={line.x2}
                    cy={line.y2}
                    r={isHighlighted ? 4.5 : 3.5}
                    fill="#c084fc"
                    className="shadow"
                  />

                  {/* Interactive Cardinality Badge in the middle of the line */}
                  <foreignObject
                    x={line.midX - 32}
                    y={line.midY - 12}
                    width="64"
                    height="24"
                    className="overflow-visible pointer-events-auto"
                  >
                    <div
                      onMouseEnter={() => setHoveredRel(line.rel)}
                      onMouseLeave={() => setHoveredRel(null)}
                      onClick={() => setSelectedRel(selectedRel === line.rel ? null : line.rel)}
                      title={`Relationship: ${line.rel.from_table}.${line.rel.from_column} -> ${line.rel.to_table}.${line.rel.to_column}`}
                      className={`cursor-pointer px-1.5 py-0.5 rounded-full text-[9px] font-mono text-center font-bold border transition-all ${
                        isHighlighted
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-400 shadow-md shadow-cyan-500/50 scale-110'
                          : 'bg-black/80 text-gray-400 border-white/20 hover:border-cyan-400 hover:text-cyan-300'
                      }`}
                    >
                      N ──▶ 1
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>

          {/* Tables Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-0">
            {filteredTables.map((t) => {
              const isTableInActiveRel =
                activeRel &&
                (activeRel.from_table === t.name || activeRel.to_table === t.name);
              const isSourceTable = activeRel?.from_table === t.name;
              const isTargetTable = activeRel?.to_table === t.name;
              const isDimmed = activeRel && !isTableInActiveRel;

              // Find table foreign keys and referenced primary keys
              const tableFKs = erdData.relationships?.filter((r) => r.from_table === t.name) || [];
              const tableIncomingRefs = erdData.relationships?.filter((r) => r.to_table === t.name) || [];

              return (
                <div
                  key={t.name}
                  id={`erd-table-${t.name}`}
                  className={`rounded-xl border transition-all duration-300 flex flex-col ${
                    isSourceTable
                      ? 'bg-blue-950/30 border-cyan-400 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-400/50'
                      : isTargetTable
                      ? 'bg-purple-950/30 border-purple-400 shadow-xl shadow-purple-500/10 ring-1 ring-purple-400/50'
                      : 'bg-white/5 border-white/10 hover:border-purple-500/40'
                  } ${isDimmed ? 'opacity-35 blur-[0.3px]' : 'opacity-100'}`}
                >
                  {/* Table Header */}
                  <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${isSourceTable ? 'bg-cyan-500/20 text-cyan-300' : isTargetTable ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-500/10 text-purple-400'}`}>
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-mono text-sm font-bold text-white flex items-center gap-1.5">
                          {t.name}
                        </div>
                        <div className="text-[10px] text-gray-400 font-sans flex items-center gap-1">
                          <span>{t.columns.length} columns</span>
                          {tableFKs.length > 0 && (
                            <span className="text-cyan-400">· {tableFKs.length} FK</span>
                          )}
                          {tableIncomingRefs.length > 0 && (
                            <span className="text-purple-400">· {tableIncomingRefs.length} Ref</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectPrompt(`Show the first 10 rows and summary statistics from table ${t.name}`)}
                      className="text-[10px] bg-white/10 hover:bg-purple-500/20 text-gray-300 hover:text-purple-300 px-2 py-1 rounded transition border border-white/5"
                    >
                      + Query
                    </button>
                  </div>

                  {/* Columns List */}
                  <div className="p-2 space-y-1 divide-y divide-white/[0.03]">
                    {t.columns.map((c) => {
                      const colKey = `${t.name}.${c.name}`;
                      const fkRelation = fkMap[colKey];
                      const incomingRefs = refMap[colKey] || [];
                      const isColActive =
                        activeRel &&
                        ((activeRel.from_table === t.name && activeRel.from_column === c.name) ||
                         (activeRel.to_table === t.name && activeRel.to_column === c.name));

                      return (
                        <div
                          key={c.name}
                          id={`erd-col-${t.name}-${c.name}`}
                          onMouseEnter={() => {
                            if (fkRelation) setHoveredRel(fkRelation);
                            else if (incomingRefs.length > 0) setHoveredRel(incomingRefs[0]);
                          }}
                          onMouseLeave={() => setHoveredRel(null)}
                          className={`flex items-center justify-between text-xs font-mono py-1.5 px-2 rounded-lg transition-all ${
                            isColActive
                              ? 'bg-cyan-500/20 text-white font-semibold ring-1 ring-cyan-400/50 shadow-inner'
                              : 'hover:bg-white/5 text-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0 pr-2">
                            {/* Primary Key Badge */}
                            {c.is_primary && (
                              <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 py-0.5 rounded font-bold shrink-0">
                                PK
                              </span>
                            )}

                            {/* Foreign Key Badge */}
                            {fkRelation && (
                              <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1 py-0.5 rounded font-bold shrink-0 flex items-center gap-0.5">
                                <Link className="w-2.5 h-2.5" /> FK
                              </span>
                            )}

                            {/* Column Name */}
                            <span className={`truncate ${fkRelation ? 'text-cyan-200 font-semibold' : c.is_primary ? 'text-amber-100 font-medium' : 'text-gray-200'}`}>
                              {c.name}
                            </span>
                          </div>

                          {/* Column Metadata & Relationship Target Pill */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* FK target pill */}
                            {fkRelation && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRel(fkRelation);
                                }}
                                title={`References ${fkRelation.to_table}.${fkRelation.to_column}`}
                                className="text-[10px] text-cyan-400/90 hover:text-cyan-200 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/30 px-1.5 py-0.5 rounded flex items-center gap-1 transition"
                              >
                                <span>➜</span>
                                <span className="font-semibold">{fkRelation.to_table}.{fkRelation.to_column}</span>
                              </button>
                            )}

                            {/* PK Referenced Tag */}
                            {incomingRefs.length > 0 && (
                              <span
                                title={`Referenced by ${incomingRefs.map(r => `${r.from_table}.${r.from_column}`).join(', ')}`}
                                className="text-[10px] text-purple-300 bg-purple-950/60 border border-purple-500/30 px-1.5 py-0.5 rounded font-mono"
                              >
                                ⟵ {incomingRefs.length} ref
                              </span>
                            )}

                            {/* Data Type */}
                            <span className="text-gray-500 text-[10px]">{c.type}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Table Footer Relationship Notes */}
                  {tableFKs.length > 0 && (
                    <div className="p-2 border-t border-white/5 bg-black/20 text-[10px] text-gray-400 space-y-1">
                      {tableFKs.map((fk, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-1 text-cyan-300 font-mono">
                          <span className="truncate">🔗 {fk.from_column} ➜ {fk.to_table}.{fk.to_column}</span>
                          <button
                            onClick={() => onSelectPrompt(`Write a JOIN query between ${t.name} and ${fk.to_table} on ${fk.from_column} = ${fk.to_column}`)}
                            className="text-[9px] text-gray-400 hover:text-cyan-300 underline"
                          >
                            Join
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Relational Joins Matrix View */
        <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
            <h4 className="text-xs font-mono uppercase text-gray-300 font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Complete Schema Joins & Key Constraints Table
            </h4>
            <span className="text-xs text-gray-400">
              {erdData.relationships?.length || 0} active foreign keys
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-white/[0.02] border-b border-white/10 text-gray-400">
                <tr>
                  <th className="py-2.5 px-4">Referencing Table (FK)</th>
                  <th className="py-2.5 px-4">Foreign Key Column</th>
                  <th className="py-2.5 px-4 text-center">Relation</th>
                  <th className="py-2.5 px-4">Referenced Table (PK)</th>
                  <th className="py-2.5 px-4">Referenced Column</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {erdData.relationships && erdData.relationships.length > 0 ? (
                  erdData.relationships.map((rel, idx) => {
                    const isCopied = copiedRel === `${rel.from_table}-${rel.from_column}`;
                    return (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="py-2.5 px-4 font-semibold text-cyan-300">{rel.from_table}</td>
                        <td className="py-2.5 px-4 text-cyan-200">
                          <span className="bg-cyan-500/10 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                            {rel.from_column}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center text-gray-400">
                          <span className="text-[10px] bg-black/60 border border-white/10 px-2 py-0.5 rounded-full text-purple-300">
                            Many to One (N : 1)
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-purple-300">{rel.to_table}</td>
                        <td className="py-2.5 px-4 text-purple-200">
                          <span className="bg-purple-500/10 border border-purple-500/30 px-1.5 py-0.5 rounded">
                            {rel.to_column}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right space-x-2">
                          <button
                            onClick={(e) => copyJoinSQL(rel, e)}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white px-2 py-1 rounded transition text-[11px]"
                          >
                            {isCopied ? 'Copied!' : 'Copy JOIN'}
                          </button>
                          <button
                            onClick={() => onSelectPrompt(`Write a SQL query joining ${rel.from_table} and ${rel.to_table} on ${rel.from_table}.${rel.from_column} = ${rel.to_table}.${rel.to_column}`)}
                            className="bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 px-2.5 py-1 rounded transition text-[11px]"
                          >
                            Generate SQL
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-gray-500 font-sans">
                      No explicit foreign key relationships found in database constraints.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Visual Analytics & Chart Component
const DataVisualizer = ({ results, insights }) => {
  const [chartType, setChartType] = useState(insights?.recommended_chart || 'bar');

  if (!results || results.length === 0) return null;

  const columns = Object.keys(results[0]);
  const hasMultipleCols = columns.length > 1;
  const availableXCols = hasMultipleCols ? columns : ['_row_label', ...columns];

  const defaultX = insights?.x_axis_key && columns.includes(insights.x_axis_key)
    ? insights.x_axis_key
    : (hasMultipleCols ? columns[0] : '_row_label');
  
  // Find numeric column for Y axis
  const numericColumns = columns.filter(col => results.some(r => typeof r[col] === 'number' || (!isNaN(Number(r[col])) && r[col] !== '')));
  const defaultY = insights?.y_axis_key && columns.includes(insights.y_axis_key)
    ? insights.y_axis_key
    : (numericColumns[0] || columns[1] || columns[0]);

  const [xKey, setXKey] = useState(defaultX);
  const [yKey, setYKey] = useState(defaultY);

  const formattedData = useMemo(() => {
    return results.slice(0, 30).map((r, idx) => ({
      ...r,
      _row_label: `#${idx + 1}`,
      [yKey]: Number(r[yKey]) || 0
    }));
  }, [results, yKey]);

  return (
    <div className="space-y-4">
      {/* Chart Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          {['bar', 'line', 'area', 'pie'].map((type) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className={`px-3 py-1 rounded-lg text-xs font-mono uppercase transition ${
                chartType === type
                  ? 'bg-purple-600 text-white font-bold shadow-lg shadow-purple-500/20'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">X:</span>
            <select
              value={xKey}
              onChange={(e) => setXKey(e.target.value)}
              className="bg-black/60 border border-white/10 rounded px-2 py-1 text-gray-200 outline-none"
            >
              {availableXCols.map(c => (
                <option key={c} value={c}>
                  {c === '_row_label' ? 'Row Index (#1, #2...)' : c}
                </option>
              ))}
            </select>
          </div>
          {numericColumns.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500">Y:</span>
              <select
                value={yKey}
                onChange={(e) => setYKey(e.target.value)}
                className="bg-black/60 border border-white/10 rounded px-2 py-1 text-gray-200 outline-none"
              >
                {numericColumns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full bg-black/40 rounded-xl p-2 border border-white/5">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey={xKey} stroke="#888" fontSize={11} tickLine={false} />
              <YAxis stroke="#888" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }} />
              <Line type="monotone" dataKey={yKey} stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          ) : chartType === 'area' ? (
            <AreaChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey={xKey} stroke="#888" fontSize={11} tickLine={false} />
              <YAxis stroke="#888" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }} />
              <Area type="monotone" dataKey={yKey} stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} />
            </AreaChart>
          ) : chartType === 'pie' ? (
            <PieChart>
              <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }} />
              <Pie data={formattedData} dataKey={yKey} nameKey={xKey} cx="50%" cy="50%" outerRadius={80} label>
                {formattedData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          ) : (
            <BarChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey={xKey} stroke="#888" fontSize={11} tickLine={false} />
              <YAxis stroke="#888" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }} />
              <Bar dataKey={yKey} fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Business Insights Box */}
      {insights?.key_takeaways && (
        <div className="bg-purple-950/20 border border-purple-500/20 rounded-xl p-4">
          <h4 className="text-xs font-mono uppercase text-purple-400 mb-2 flex items-center gap-1.5 font-bold">
            <Sparkles className="w-3.5 h-3.5" /> AI Executive Insights
          </h4>
          <ul className="space-y-1.5">
            {insights.key_takeaways.map((point, idx) => (
              <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                <span className="text-purple-400 font-bold">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Performance Advisor Component
const PerformanceAdvisor = ({ advisor, explainPlan, executionTime }) => {
  if (!advisor) return null;

  const isOptimal = advisor.performance_rating === 'OPTIMAL';

  return (
    <GlassCard className="p-5 border-white/10">
      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-gray-200">
            Database Performance Advisor (EXPLAIN)
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold ${
            isOptimal ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}>
            {advisor.performance_rating}
          </span>
          <span className="text-[10px] font-mono bg-white/5 text-gray-400 px-2 py-0.5 rounded">
            {executionTime}s
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-black/40 rounded-xl p-3 border border-white/5">
          <h4 className="text-[11px] font-mono text-gray-400 uppercase mb-2 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-blue-400" /> DBA Recommendations
          </h4>
          <ul className="space-y-1 text-xs text-gray-300">
            {advisor.recommendations?.map((r, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-blue-400">›</span> {r}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-black/40 rounded-xl p-3 border border-white/5">
          <h4 className="text-[11px] font-mono text-gray-400 uppercase mb-2 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-purple-400" /> Index Advice
          </h4>
          {advisor.suggested_indexes?.length > 0 ? (
            <div className="space-y-1.5">
              {advisor.suggested_indexes.map((idx, i) => (
                <code key={i} className="block text-[11px] bg-white/5 text-purple-300 p-1.5 rounded font-mono break-all">
                  {idx}
                </code>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic">No missing indexes detected for this query.</p>
          )}
        </div>
      </div>

      {explainPlan && explainPlan.length > 0 && !explainPlan[0].error && (
        <details className="mt-3 text-xs font-mono">
          <summary className="text-gray-400 hover:text-white cursor-pointer select-none">
            Raw MySQL EXPLAIN Execution Plan ({explainPlan.length} steps)
          </summary>
          <div className="overflow-x-auto mt-2 bg-black/60 rounded-lg p-2 border border-white/10">
            <table className="w-full text-[10px] text-gray-300">
              <thead>
                <tr className="border-b border-white/10 text-gray-500">
                  {Object.keys(explainPlan[0]).map(k => <th key={k} className="p-1 text-left">{k}</th>)}
                </tr>
              </thead>
              <tbody>
                {explainPlan.map((row, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                    {Object.values(row).map((v, j) => <td key={j} className="p-1">{String(v ?? 'NULL')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </GlassCard>
  );
};

// Main Application
export default function App() {
  const [isConnected, setIsConnected] = useState(true);
  const [showConnectionPage, setShowConnectionPage] = useState(false);
  const [mode, setMode] = useState('database'); // 'database' | 'study' | 'erd'
  const [question, setQuestion] = useState('');

  // DB credentials
  const [host, setHost] = useState('127.0.0.1');
  const [port, setPort] = useState('3306');
  const [user, setUser] = useState('root');
  const [password, setPassword] = useState('');
  const [database, setDatabase] = useState('company');

  // Query responses
  const [studyType, setStudyType] = useState('table'); // 'table' | 'concept'
  const [studyAnswer, setStudyAnswer] = useState('');
  const [sqlQuery, setSqlQuery] = useState('');
  const [explanation, setExplanation] = useState('');
  const [allResults, setAllResults] = useState([]);
  const [paginatedResults, setPaginatedResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [executionTime, setExecutionTime] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(6);

  // Advanced features state
  const [insights, setInsights] = useState(null);
  const [advisor, setAdvisor] = useState(null);
  const [explainPlan, setExplainPlan] = useState([]);
  const [erdData, setErdData] = useState(null);
  const [maskPii, setMaskPii] = useState(true);
  const [piiMaskedCount, setPiiMaskedCount] = useState(0);
  const [modelInfo, setModelInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'visualize' | 'advisor'

  // History & Multi-turn memory
  const [studyHistory, setStudyHistory] = useState([]);
  const [executeHistory, setExecuteHistory] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);

  const fetchStudyHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/study-history`);
      const data = await res.json();
      setStudyHistory(data.history || []);
    } catch (err) {
      console.log(err);
    }
  }, []);

  const fetchExecuteHistory = useCallback(async () => {
    if (!isConnected) return;
    try {
      const res = await fetch(`${API_BASE}/execute-history`);
      const data = await res.json();
      setExecuteHistory(data.history || []);
    } catch (err) {
      console.log(err);
    }
  }, [isConnected]);

  const fetchErd = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/schema-erd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port: Number(port), user, password, database })
      });
      const data = await res.json();
      if (data.success) {
        setErdData(data.erd);
      } else {
        setError(data.error || 'Failed to fetch schema');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudyHistory();
    if (isConnected) {
      fetchExecuteHistory();
      fetchErd();
    }
  }, [isConnected, fetchStudyHistory, fetchExecuteHistory]);

  useEffect(() => {
    if (allResults.length > 0) {
      const startIndex = (currentPage - 1) * rowsPerPage;
      setPaginatedResults(allResults.slice(startIndex, startIndex + rowsPerPage));
    } else {
      setPaginatedResults([]);
    }
  }, [allResults, currentPage, rowsPerPage]);

  const handleGenerate = async (queryText = question) => {
    const promptText = queryText || question;
    if (!promptText.trim()) return;

    setLoading(true);
    setError('');
    setCurrentPage(1);

    try {
      if (mode === 'database') {
        const response = await fetch(`${API_BASE}/generate-and-execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host,
            port: Number(port),
            user,
            password,
            database,
            question: promptText,
            conversation_history: conversationHistory,
            mask_pii: maskPii
          }),
        });
        const data = await response.json();
        if (data.error) {
          setError(data.error);
          if (data.blocked_query) {
            setSqlQuery(data.blocked_query);
          }
        } else {
          setIsConnected(true);
          setSqlQuery(data.sql_query);
          setExplanation(data.explanation);
          setAllResults(data.results || []);
          setExecutionTime(data.execution_time_seconds || 0);
          setInsights(data.insights);
          setAdvisor(data.performance_advisor);
          setExplainPlan(data.explain_plan || []);
          setPiiMaskedCount(data.pii_masked_count || 0);
          setModelInfo({ model: data.model_used, key: data.key_used });

          // Update conversational multi-turn history
          setConversationHistory(prev => [...prev, {
            question: promptText,
            sql_query: data.sql_query
          }]);

          await fetchExecuteHistory();
        }
      } else {
        const response = await fetch(`${API_BASE}/study-sql`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: promptText,
            study_type: studyType,
            conversation_history: conversationHistory,
            host,
            port: Number(port),
            user,
            password,
            database
          }),
        });
        const data = await response.json();
        if (data.error) {
          setError(data.error);
        } else {
          const resAnswer = data.answer || data.explanation || '';
          setStudyAnswer(resAnswer);
          setExplanation(resAnswer);
          setSqlQuery(data.sql_query || '');
          setAllResults([]);
          setModelInfo({ model: data.model_used, key: data.key_used });
          setConversationHistory(prev => [...prev, {
            question: promptText,
            answer: resAnswer
          }]);
          await fetchStudyHistory();
        }
      }
    } catch (err) {
      setError(`Backend error: ${err.message}. Ensure FastAPI server is running on port 8000.`);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!allResults || allResults.length === 0) return;
    const headers = Object.keys(allResults[0]).join(',');
    const rows = allResults.map(r => Object.values(r).map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_export_${Date.now()}.csv`;
    a.click();
  };

  const totalPages = Math.ceil(allResults.length / rowsPerPage);
  const tableColumns = paginatedResults.length > 0 ? Object.keys(paginatedResults[0]) : [];
  const currentHistory = mode === 'database' ? executeHistory : studyHistory;

  return (
    <div className="relative min-h-screen bg-transparent text-gray-200">
      <AnimatedBackground />

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">
        {/* Navigation / Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                  QueryForge AI Pro
                </h1>
                <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                  Multi-Key Fallback Active
                </span>
              </div>
              <p className="text-gray-400 text-xs font-medium">
                Enterprise AI SQL Assistant · Auto-BI · DBA Optimization · Guardrails
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setMode('database'); setShowConnectionPage(false); }}
              className={`px-4 py-2 rounded-xl font-semibold text-xs transition flex items-center gap-2 ${
                mode === 'database'
                  ? 'bg-white text-black shadow-lg shadow-white/20'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Database Mode
            </button>
            <button
              onClick={() => { setMode('tables'); setShowConnectionPage(false); }}
              className={`px-4 py-2 rounded-xl font-semibold text-xs transition flex items-center gap-2 ${
                mode === 'tables'
                  ? 'bg-white text-black shadow-lg shadow-white/20'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              <Table className="w-3.5 h-3.5 text-cyan-400" />
              Table Studio (CRUD)
            </button>
            <button
              onClick={() => { setMode('erd'); if (!erdData && isConnected) fetchErd(); }}
              className={`px-4 py-2 rounded-xl font-semibold text-xs transition flex items-center gap-2 ${
                mode === 'erd'
                  ? 'bg-white text-black shadow-lg shadow-white/20'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              ERD Explorer
            </button>
            <button
              onClick={() => { setMode('study'); setShowConnectionPage(false); }}
              className={`px-4 py-2 rounded-xl font-semibold text-xs transition flex items-center gap-2 ${
                mode === 'study'
                  ? 'bg-white text-black shadow-lg shadow-white/20'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Study Mode
            </button>
            <button
              onClick={() => setShowConnectionPage(!showConnectionPage)}
              className={`px-3 py-2 rounded-xl text-xs font-mono transition border flex items-center gap-2 ${
                isConnected
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
              }`}
              title="Click to change MySQL database settings"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>DB: {database}</span>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`}></span>
            </button>
          </div>
        </div>

        {/* Database Connection Config Modal/Drawer */}
        {showConnectionPage && (
          <GlassCard className="p-5 mb-6 border-purple-500/30">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-400" /> Database Connection Parameters
              </h3>
              <button onClick={() => setShowConnectionPage(false)} className="text-gray-400 hover:text-white text-xs">✕</button>
            </div>
            
            <div className="mb-3 flex items-center gap-2 text-xs font-mono">
              <span className="text-gray-400">Quick Select DB:</span>
              {['company', 'ai_sql_history', 'study'].map((dbName) => (
                <button
                  key={dbName}
                  onClick={() => setDatabase(dbName)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] transition ${
                    database === dbName
                      ? 'bg-purple-600 text-white font-bold'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {dbName}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="text-[10px] font-mono text-gray-400">HOST</label>
                <input value={host} onChange={e => setHost(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs font-mono" />
              </div>
              <div>
                <label className="text-[10px] font-mono text-gray-400">PORT</label>
                <input value={port} onChange={e => setPort(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs font-mono" />
              </div>
              <div>
                <label className="text-[10px] font-mono text-gray-400">USER</label>
                <input value={user} onChange={e => setUser(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs font-mono" />
              </div>
              <div>
                <label className="text-[10px] font-mono text-gray-400">PASSWORD</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs font-mono" />
              </div>
              <div>
                <label className="text-[10px] font-mono text-gray-400">DATABASE</label>
                <input value={database} onChange={e => setDatabase(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs font-mono" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setIsConnected(true); setShowConnectionPage(false); fetchErd(); }}
                className="bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition"
              >
                Save & Connect
              </button>
            </div>
          </GlassCard>
        )}

        {/* Main Workspace Layout */}
        {mode === 'tables' ? (
          <GlassCard className="p-5">
            <TableStudio
              credentials={{ host, port, user, password, database }}
              onSelectPrompt={(text) => {
                setQuestion(text);
                setMode('database');
              }}
              onSwitchMode={(newMode) => setMode(newMode)}
            />
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Sidebar (History & Conversations) */}
            <div className="lg:col-span-3">
            <GlassCard className="h-full flex flex-col p-4">
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  <h2 className="font-mono text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    {mode === 'database' ? 'Execution Log' : 'Study Log'}
                  </h2>
                </div>
                {conversationHistory.length > 0 && (
                  <button
                    onClick={() => setConversationHistory([])}
                    className="text-[10px] font-mono bg-white/5 hover:bg-white/10 text-gray-400 px-2 py-0.5 rounded"
                    title="Reset conversational context memory"
                  >
                    Reset Chat
                  </button>
                )}
              </div>

              {conversationHistory.length > 0 && (
                <div className="mb-3 bg-purple-950/20 border border-purple-500/20 rounded-lg p-2 text-[11px] font-mono text-purple-300 flex items-center justify-between">
                  <span>🧠 Memory: {conversationHistory.length} turns active</span>
                </div>
              )}

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[65vh]">
                {currentHistory.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <p className="text-xs font-mono">No queries yet</p>
                  </div>
                ) : (
                  currentHistory.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      onClick={() => {
                        setQuestion(item.question || item.title);
                        if (item.sql_query) setSqlQuery(item.sql_query);
                        if (item.explanation) {
                          setExplanation(item.explanation);
                          setStudyAnswer(item.explanation);
                        }
                      }}
                      className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 rounded-xl p-3 cursor-pointer transition text-left"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-purple-400/80 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                          {mode === 'database' ? 'SQL Query' : 'Tutor Chat'}
                        </span>
                        <span className="text-[10px] font-mono text-gray-500">{item.created_at?.slice(0, 16)}</span>
                      </div>
                      <p className="text-xs text-gray-200 font-medium line-clamp-2">
                        {item.title && !item.title.match(/^\d{4}-\d{2}-\d{2}/) ? item.title : (item.question || 'Database Query')}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-white/10 mt-auto">
                <button
                  onClick={() => setMode('tables')}
                  className="w-full py-2 px-3 rounded-xl text-xs font-mono bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center gap-2 transition"
                >
                  <Table className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Open Table Studio (CRUD)</span>
                </button>
              </div>
            </GlassCard>
          </div>

          {/* Right Main Content */}
          <div className="lg:col-span-9 space-y-5">
            {/* ERD View Mode */}
            {mode === 'erd' ? (
              <GlassCard className="p-5">
                <ERDVisualizer
                  erdData={erdData}
                  onSelectPrompt={(text) => {
                    setQuestion(text);
                    setMode('database');
                  }}
                />
              </GlassCard>
            ) : (
              <>
                {/* Input Query Card */}
                <GlassCard className="p-5">
                  {/* Study Sub-Mode Selector */}
                  {mode === 'study' && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4 bg-white/5 p-1.5 rounded-xl border border-white/10">
                      <button
                        onClick={() => { setStudyType('table'); setQuestion(''); }}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono transition flex items-center justify-center gap-2 ${
                          studyType === 'table'
                            ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-500/30'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Database className="w-3.5 h-3.5 text-purple-300" />
                        <span>Table & Schema Tutor</span>
                        <span className="text-[10px] bg-purple-900/60 text-purple-200 px-1.5 py-0.5 rounded border border-purple-400/30">
                          DB: {database}
                        </span>
                      </button>
                      <button
                        onClick={() => { setStudyType('concept'); setQuestion(''); }}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono transition flex items-center justify-center gap-2 ${
                          studyType === 'concept'
                            ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/30'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5 text-indigo-300" />
                        <span>General SQL Theory</span>
                        <span className="text-[10px] bg-indigo-900/60 text-indigo-200 px-1.5 py-0.5 rounded border border-indigo-400/30">
                          No DB Required
                        </span>
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase text-gray-400">
                        {mode === 'database' ? 'Ask Database Query:' : (studyType === 'table' ? 'Ask Table / Schema Question:' : 'Ask SQL Concept / Theory:')}
                      </span>
                      {modelInfo && (
                        <span className="text-[10px] font-mono bg-white/5 text-emerald-400 px-2 py-0.5 rounded border border-white/10">
                          ⚡ {modelInfo.model} ({modelInfo.key})
                        </span>
                      )}
                    </div>
                    {mode === 'database' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setMaskPii(!maskPii)}
                          className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 ${
                            maskPii
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : 'bg-white/5 text-gray-400 border-white/10'
                          }`}
                        >
                          {maskPii ? <Shield className="w-3 h-3 text-emerald-400" /> : <Eye className="w-3 h-3" />}
                          PII Guard: {maskPii ? 'Active' : 'Off'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row gap-3">
                    <textarea
                      rows={3}
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder={
                        mode === 'database'
                          ? '🔍 Ask in natural language or follow-up...\nExample: "Show top 5 customers with their total spend" or "Filter only by 2024"'
                          : studyType === 'table'
                          ? '📊 Ask about your connected database tables...\nExample: "How many datas in employees?" or "How to optimize the employees table?" or "Explain table structure"'
                          : '📚 Ask any SQL concept...\nExample: "Explain about window function" or "Difference between WHERE and HAVING" or "Explain CTE with example"'
                      }
                      className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none resize-none focus:border-purple-500/50 font-mono text-sm text-gray-200 placeholder:text-gray-600 transition"
                    />
                    <button
                      onClick={() => handleGenerate()}
                      disabled={loading || !question.trim()}
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold rounded-xl px-7 py-3 transition shadow-lg shadow-purple-500/20 disabled:opacity-40 flex items-center justify-center gap-2 min-w-[140px]"
                    >
                      {loading ? (
                        <><RefreshCw className="w-4 h-4 animate-spin" /> Processing</>
                      ) : (
                        <><Sparkles className="w-4 h-4" /> {mode === 'database' ? 'Run Query' : 'Ask Tutor'}</>
                      )}
                    </button>
                  </div>

                  {/* Quick Suggested Prompt Chips in Study Mode */}
                  {mode === 'study' && (
                    <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-mono text-gray-500 mr-1">Suggestions:</span>
                      {studyType === 'table' ? (
                        <>
                          <button
                            onClick={() => setQuestion('How many records are in the employees table?')}
                            className="text-[11px] font-mono bg-white/5 hover:bg-purple-600/20 hover:text-purple-300 border border-white/5 px-2.5 py-1 rounded-lg transition"
                          >
                            📊 "How many records are in employees?"
                          </button>
                          <button
                            onClick={() => setQuestion('How to optimize the employees table performance and indexes?')}
                            className="text-[11px] font-mono bg-white/5 hover:bg-purple-600/20 hover:text-purple-300 border border-white/5 px-2.5 py-1 rounded-lg transition"
                          >
                            ⚡ "How to optimize employees table?"
                          </button>
                          <button
                            onClick={() => setQuestion('Explain columns, primary keys, and data types of table employees')}
                            className="text-[11px] font-mono bg-white/5 hover:bg-purple-600/20 hover:text-purple-300 border border-white/5 px-2.5 py-1 rounded-lg transition"
                          >
                            🔍 "Explain table schema & indexes"
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setQuestion('Explain about window function with examples')}
                            className="text-[11px] font-mono bg-white/5 hover:bg-indigo-600/20 hover:text-indigo-300 border border-white/5 px-2.5 py-1 rounded-lg transition"
                          >
                            💡 "Explain Window Functions"
                          </button>
                          <button
                            onClick={() => setQuestion('Explain the difference between WHERE and HAVING with examples')}
                            className="text-[11px] font-mono bg-white/5 hover:bg-indigo-600/20 hover:text-indigo-300 border border-white/5 px-2.5 py-1 rounded-lg transition"
                          >
                            💡 "WHERE vs HAVING"
                          </button>
                          <button
                            onClick={() => setQuestion('What is a CTE (Common Table Expression) and how does it improve queries?')}
                            className="text-[11px] font-mono bg-white/5 hover:bg-indigo-600/20 hover:text-indigo-300 border border-white/5 px-2.5 py-1 rounded-lg transition"
                          >
                            💡 "Explain CTEs"
                          </button>
                          <button
                            onClick={() => setQuestion('How do Database Indexes and B-Trees work under the hood?')}
                            className="text-[11px] font-mono bg-white/5 hover:bg-indigo-600/20 hover:text-indigo-300 border border-white/5 px-2.5 py-1 rounded-lg transition"
                          >
                            💡 "How Indexes work"
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </GlassCard>

                {/* Error Banner */}
                {error && (
                  <div className="bg-red-950/40 border border-red-500/40 text-red-300 rounded-xl p-4 text-xs font-mono flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 mt-0.5 text-red-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-bold text-red-400">Execution / Safety Alert:</p>
                      <p className="mt-1">{error}</p>
                    </div>
                  </div>
                )}

                {/* STUDY MODE: Dedicated Full-Width Direct Answer Card (NO rigid code editor) */}
                {mode === 'study' && (studyAnswer || explanation) && (
                  <GlassCard className="p-6 border-purple-500/20">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        {studyType === 'table' ? (
                          <>
                            <Database className="w-4 h-4 text-purple-400" />
                            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-300">
                              Table & Schema Advisor ({database})
                            </h3>
                          </>
                        ) : (
                          <>
                            <BookOpen className="w-4 h-4 text-indigo-400" />
                            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-indigo-300">
                              General SQL Theory & Concept Guide
                            </h3>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(studyAnswer || explanation)}
                        className="text-[10px] font-mono text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded transition flex items-center gap-1.5"
                      >
                        <Copy className="w-3 h-3" /> Copy Response
                      </button>
                    </div>

                    <MarkdownViewer content={studyAnswer || explanation} />
                  </GlassCard>
                )}

                {/* DATABASE MODE: SQL and AI Explanation Cards */}
                {mode === 'database' && (sqlQuery || explanation) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <GlassCard className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-mono uppercase text-gray-400 flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-emerald-400" /> Generated SQL
                        </span>
                        <button
                          onClick={() => navigator.clipboard.writeText(sqlQuery)}
                          className="text-[10px] font-mono text-gray-400 hover:text-white bg-white/5 px-2 py-1 rounded transition flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      </div>
                      <pre className="bg-black/60 rounded-xl p-3 text-emerald-400 font-mono text-xs overflow-x-auto max-h-56 border border-white/5 whitespace-pre-wrap">
                        {sqlQuery}
                      </pre>
                    </GlassCard>

                    <GlassCard className="p-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-xs font-mono uppercase text-gray-400">AI Explanation</span>
                      </div>
                      <div className="bg-black/60 rounded-xl p-3 text-xs font-mono text-gray-300 overflow-y-auto max-h-56 border border-white/5">
                        <MarkdownViewer content={explanation} />
                      </div>
                    </GlassCard>
                  </div>
                )}

                {/* Query Results & Interactive BI Tabs */}
                {mode === 'database' && (allResults.length > 0 || (sqlQuery && !loading && !error)) && (
                  <GlassCard className="p-5">
                    {/* View Switcher Tabs */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveTab('table')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 ${
                            activeTab === 'table' ? 'bg-white text-black font-bold' : 'text-gray-400 hover:text-white bg-white/5'
                          }`}
                        >
                          Table Data ({allResults.length})
                        </button>
                        <button
                          onClick={() => setActiveTab('visualize')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 ${
                            activeTab === 'visualize' ? 'bg-purple-600 text-white font-bold' : 'text-gray-400 hover:text-white bg-white/5'
                          }`}
                        >
                          <Sparkles className="w-3 h-3" /> Auto Visualization & BI
                        </button>
                        <button
                          onClick={() => setActiveTab('advisor')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 ${
                            activeTab === 'advisor' ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-white bg-white/5'
                          }`}
                        >
                          <Activity className="w-3 h-3" /> DBA Performance Advisor
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {piiMaskedCount > 0 && (
                          <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                            🛡️ {piiMaskedCount} fields masked
                          </span>
                        )}
                        {allResults.length > 0 && (
                          <button
                            onClick={exportCSV}
                            className="bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 border border-white/10"
                          >
                            <Download className="w-3 h-3" /> Export CSV
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Content for Tabs */}
                    {activeTab === 'table' && (
                      allResults.length === 0 ? (
                        <div className="text-center py-10 bg-white/5 rounded-xl border border-white/5">
                          <p className="text-xs font-mono text-gray-300">Query executed successfully, but 0 rows were returned.</p>
                          <p className="text-[11px] font-mono text-gray-500 mt-1">Target database: <span className="text-purple-300 font-semibold">{database}</span></p>
                        </div>
                      ) : (
                        <div>
                          <div className="overflow-x-auto rounded-xl border border-white/10 max-h-[400px]">
                            <table className="w-full text-xs">
                              <thead className="bg-black/90 sticky top-0">
                                <tr>
                                  <th className="text-left p-3 font-mono text-[10px] text-gray-400 border-b border-white/10">#</th>
                                  {tableColumns.map(col => (
                                    <th key={col} className="text-left p-3 font-mono text-[10px] text-gray-300 border-b border-white/10">{col}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {paginatedResults.map((row, idx) => (
                                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="p-3 font-mono text-[11px] text-gray-500">{(currentPage - 1) * rowsPerPage + idx + 1}</td>
                                    {tableColumns.map(col => (
                                      <td key={col} className="p-3 font-mono text-[11px] text-gray-300">
                                        {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span className="text-gray-500 italic">NULL</span>}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Pagination */}
                          <div className="flex justify-between items-center mt-3 text-xs font-mono">
                            <button
                              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                              disabled={currentPage === 1}
                              className="bg-white/5 hover:bg-white/10 disabled:opacity-30 px-3 py-1.5 rounded"
                            >
                              Previous
                            </button>
                            <span className="text-gray-400">Page {currentPage} of {totalPages}</span>
                            <button
                              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              className="bg-white/5 hover:bg-white/10 disabled:opacity-30 px-3 py-1.5 rounded"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )
                    )}

                    {activeTab === 'visualize' && (
                      allResults.length === 0 ? (
                        <div className="text-center py-10 bg-white/5 rounded-xl border border-white/5 text-gray-400 font-mono text-xs">
                          Visualizations require at least 1 returned data row.
                        </div>
                      ) : (
                        <DataVisualizer results={allResults} insights={insights} />
                      )
                    )}

                    {activeTab === 'advisor' && (
                      <PerformanceAdvisor advisor={advisor} explainPlan={explainPlan} executionTime={executionTime} />
                    )}
                  </GlassCard>
                )}
              </>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}