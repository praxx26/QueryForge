import React, { useState, useEffect, useCallback } from 'react';
import {
  Database, Table, Plus, Pencil, Trash2, RefreshCw, Search,
  ChevronLeft, ChevronRight, Check, X, AlertTriangle, Layers,
  ExternalLink, Key, Sparkles, Filter
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function TableStudio({
  credentials,
  onSelectPrompt,
  onSwitchMode
}) {
  const { host, port, user, password, database } = credentials;

  // Tables state
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableSearch, setTableSearch] = useState('');
  const [loadingTables, setLoadingTables] = useState(false);

  // Table Data state
  const [tableData, setTableData] = useState(null);
  const [dataSearch, setDataSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loadingData, setLoadingData] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [isInsertOpen, setIsInsertOpen] = useState(false);
  const [insertValues, setInsertValues] = useState({});
  const [isSubmittingInsert, setIsSubmittingInsert] = useState(false);

  const [editingRow, setEditingRow] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const [deletingRow, setDeletingRow] = useState(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Helper to show transient success messages
  const notifySuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Helper to show transient error messages
  const notifyError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  // 1. Fetch tables list
  const fetchTables = useCallback(async () => {
    setLoadingTables(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/tables/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port: Number(port), user, password, database })
      });
      const data = await res.json();
      if (data.success) {
        setTables(data.tables || []);
        if (data.tables && data.tables.length > 0 && !selectedTable) {
          setSelectedTable(data.tables[0].name);
        }
      } else {
        notifyError(data.error || 'Failed to list database tables');
      }
    } catch (err) {
      notifyError(err.message || 'Error connecting to database');
    } finally {
      setLoadingTables(false);
    }
  }, [host, port, user, password, database, selectedTable]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  // 2. Fetch data rows for the selected table
  const fetchTableRows = useCallback(async (targetTable, targetPage = 1, search = '') => {
    if (!targetTable) return;
    setLoadingData(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/tables/rows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host,
          port: Number(port),
          user,
          password,
          database,
          table_name: targetTable,
          page: targetPage,
          page_size: pageSize,
          search: search || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setTableData(data);
        setPage(targetPage);
      } else {
        notifyError(data.error || 'Failed to fetch table rows');
      }
    } catch (err) {
      notifyError(err.message || 'Error loading table data');
    } finally {
      setLoadingData(false);
    }
  }, [host, port, user, password, database, pageSize]);

  useEffect(() => {
    if (selectedTable) {
      fetchTableRows(selectedTable, 1, dataSearch);
    }
  }, [selectedTable, fetchTableRows]);

  // Filtered tables for sidebar
  const filteredTables = tables.filter((t) =>
    t.name.toLowerCase().includes(tableSearch.toLowerCase())
  );

  // Open Insert Modal
  const handleOpenInsert = () => {
    if (!tableData || !tableData.columns) return;
    const initialVals = {};
    tableData.columns.forEach((col) => {
      initialVals[col.name] = '';
    });
    setInsertValues(initialVals);
    setIsInsertOpen(true);
  };

  // Submit Insert
  const handleInsertSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTable) return;
    setIsSubmittingInsert(true);
    try {
      const res = await fetch(`${API_BASE}/tables/insert-row`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host,
          port: Number(port),
          user,
          password,
          database,
          table_name: selectedTable,
          data: insertValues
        })
      });
      const data = await res.json();
      if (data.success) {
        notifySuccess('Row inserted successfully!');
        setIsInsertOpen(false);
        fetchTableRows(selectedTable, page, dataSearch);
        fetchTables(); // refresh row counts
      } else {
        notifyError(data.error || 'Failed to insert row');
      }
    } catch (err) {
      notifyError(err.message || 'Error inserting row');
    } finally {
      setIsSubmittingInsert(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (row) => {
    if (!tableData || !tableData.columns) return;
    setEditingRow(row);
    const initialVals = {};
    tableData.columns.forEach((col) => {
      initialVals[col.name] = row[col.name] !== null && row[col.name] !== undefined ? row[col.name] : '';
    });
    setEditValues(initialVals);
  };

  // Submit Edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTable || !editingRow || !tableData.primary_key) {
      notifyError('Table does not have a primary key configured to safely identify row.');
      return;
    }
    setIsSubmittingEdit(true);
    try {
      const pk = tableData.primary_key;
      const pkVal = editingRow[pk];

      const res = await fetch(`${API_BASE}/tables/update-row`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host,
          port: Number(port),
          user,
          password,
          database,
          table_name: selectedTable,
          primary_key: pk,
          primary_value: pkVal,
          data: editValues
        })
      });
      const data = await res.json();
      if (data.success) {
        notifySuccess('Row updated successfully!');
        setEditingRow(null);
        fetchTableRows(selectedTable, page, dataSearch);
      } else {
        notifyError(data.error || 'Failed to update row');
      }
    } catch (err) {
      notifyError(err.message || 'Error updating row');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Open Delete Dialog
  const handleOpenDelete = (row) => {
    setDeletingRow(row);
  };

  // Submit Delete
  const handleDeleteSubmit = async () => {
    if (!selectedTable || !deletingRow || !tableData.primary_key) {
      notifyError('Table must have a primary key to safely delete row.');
      return;
    }
    setIsSubmittingDelete(true);
    try {
      const pk = tableData.primary_key;
      const pkVal = deletingRow[pk];

      const res = await fetch(`${API_BASE}/tables/delete-row`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host,
          port: Number(port),
          user,
          password,
          database,
          table_name: selectedTable,
          primary_key: pk,
          primary_value: pkVal
        })
      });
      const data = await res.json();
      if (data.success) {
        notifySuccess('Row deleted successfully!');
        setDeletingRow(null);
        fetchTableRows(selectedTable, page, dataSearch);
        fetchTables(); // refresh row counts
      } else {
        notifyError(data.error || 'Failed to delete row');
      }
    } catch (err) {
      notifyError(err.message || 'Error deleting row');
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  const totalPages = tableData ? Math.ceil((tableData.total || 0) / pageSize) : 1;

  return (
    <div className="space-y-4">
      {/* Top Banner Alert / Notifications */}
      {successMsg && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl text-xs font-mono flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')}><X className="w-3.5 h-3.5 opacity-60 hover:opacity-100" /></button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 px-4 py-2.5 rounded-xl text-xs font-mono flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')}><X className="w-3.5 h-3.5 opacity-60 hover:opacity-100" /></button>
        </div>
      )}

      {/* Main Container Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[580px]">
        {/* Left: Connected Tables List (MongoDB Compass style) */}
        <div className="lg:col-span-3 bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <div>
                <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  Connected Tables
                </h4>
                <p className="text-[10px] text-gray-400 font-sans">
                  Database: <span className="text-cyan-300 font-mono font-semibold">{database}</span>
                </p>
              </div>
            </div>
            <button
              onClick={fetchTables}
              disabled={loadingTables}
              title="Refresh database tables"
              className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingTables ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>

          {/* Table search filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search tables..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Tables list */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[460px]">
            {filteredTables.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-xs font-mono">
                No tables found in '{database}'
              </div>
            ) : (
              filteredTables.map((t) => {
                const isSelected = selectedTable === t.name;
                return (
                  <button
                    key={t.name}
                    onClick={() => {
                      setSelectedTable(t.name);
                      setDataSearch('');
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-950/60 to-purple-950/40 border-cyan-400/60 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/30'
                        : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Table className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-gray-400 group-hover:text-cyan-300'}`} />
                      <div className="min-w-0">
                        <div className={`text-xs font-mono font-bold truncate ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                          {t.name}
                        </div>
                        <div className="text-[10px] text-gray-500 font-sans">
                          {t.column_count} columns {t.primary_key ? `· PK: ${t.primary_key}` : ''}
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                        : 'bg-white/5 text-gray-400'
                    }`}>
                      {t.row_count} rows
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Quick AI Prompt Trigger */}
          {selectedTable && (
            <div className="pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  onSelectPrompt(`Explore and summarize table ${selectedTable} in database ${database}`);
                  onSwitchMode('database');
                }}
                className="w-full py-2 px-3 rounded-lg text-xs font-mono bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center gap-2 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Ask AI About {selectedTable}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Table Data Grid & CRUD Operations */}
        <div className="lg:col-span-9 bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col space-y-4">
          {/* Table Header Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-xl text-cyan-300">
                <Table className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold font-mono text-white">
                    {selectedTable || 'Select a table'}
                  </h3>
                  {tableData?.primary_key && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                      <Key className="w-2.5 h-2.5" /> PK: {tableData.primary_key}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 font-sans mt-0.5">
                  Showing {tableData?.rows?.length || 0} of {tableData?.total || 0} total records
                </p>
              </div>
            </div>

            {/* Action Buttons: Add Row, Search, Refresh */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Row Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter rows..."
                  value={dataSearch}
                  onChange={(e) => {
                    setDataSearch(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      fetchTableRows(selectedTable, 1, dataSearch);
                    }
                  }}
                  className="bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 w-36 sm:w-48"
                />
              </div>

              <button
                onClick={() => fetchTableRows(selectedTable, page, dataSearch)}
                disabled={loadingData}
                title="Search / Refresh data"
                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 hover:text-white transition text-xs flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin text-cyan-400' : ''}`} />
              </button>

              <button
                onClick={handleOpenInsert}
                disabled={!selectedTable || loadingData}
                className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-cyan-600/20 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Insert Row</span>
              </button>
            </div>
          </div>

          {/* Table Data View */}
          <div className="flex-1 overflow-x-auto min-h-[380px] rounded-xl border border-white/10 bg-black/40">
            {loadingData ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 font-mono text-xs">
                <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mb-2" />
                Loading {selectedTable} rows...
              </div>
            ) : !tableData || !tableData.rows || tableData.rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 font-mono text-xs space-y-2">
                <Table className="w-8 h-8 opacity-40 text-cyan-400 mb-1" />
                <span>No rows found in `{selectedTable}`</span>
                <button
                  onClick={handleOpenInsert}
                  className="text-cyan-400 hover:underline flex items-center gap-1 mt-2 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add the first row now
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs font-mono divide-y divide-white/10">
                <thead className="bg-white/[0.04] text-gray-300">
                  <tr>
                    <th className="py-2.5 px-3 w-16 text-center text-gray-500">Actions</th>
                    {tableData.columns.map((col) => (
                      <th key={col.name} className="py-2.5 px-3 font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {col.is_primary && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 py-0.2 rounded font-bold">
                              PK
                            </span>
                          )}
                          <span className={col.is_primary ? 'text-amber-200' : 'text-gray-200'}>
                            {col.name}
                          </span>
                          <span className="text-gray-500 text-[10px] font-normal">
                            ({col.type})
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tableData.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-white/[0.03] transition-colors group">
                      {/* Action buttons (Edit & Delete) */}
                      <td className="py-2 px-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={() => handleOpenEdit(row)}
                            title="Edit this row"
                            className="p-1 hover:bg-cyan-500/20 text-gray-400 hover:text-cyan-300 rounded transition"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(row)}
                            title="Delete this row"
                            className="p-1 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Row cells */}
                      {tableData.columns.map((col) => {
                        const val = row[col.name];
                        const isNull = val === null || val === undefined;
                        return (
                          <td
                            key={col.name}
                            className={`py-2 px-3 whitespace-nowrap max-w-xs truncate ${
                              col.is_primary ? 'text-cyan-300 font-semibold' : 'text-gray-300'
                            }`}
                            title={String(val)}
                          >
                            {isNull ? (
                              <span className="text-gray-600 italic text-[11px]">NULL</span>
                            ) : (
                              String(val)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          {tableData && tableData.total > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs font-mono">
              <span className="text-gray-400">
                Page <span className="text-white font-bold">{page}</span> of{' '}
                <span className="text-white font-bold">{totalPages}</span> ({tableData.total} items)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchTableRows(selectedTable, page - 1, dataSearch)}
                  disabled={page <= 1 || loadingData}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 rounded-lg text-gray-300 flex items-center gap-1 transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>

                <button
                  onClick={() => fetchTableRows(selectedTable, page + 1, dataSearch)}
                  disabled={page >= totalPages || loadingData}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 rounded-lg text-gray-300 flex items-center gap-1 transition"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ----------------- MODAL: INSERT ROW ----------------- */}
      {isInsertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gray-950 border border-cyan-500/40 rounded-2xl p-6 max-w-lg w-full shadow-2xl shadow-cyan-500/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold font-mono text-white">
                  Insert into `{selectedTable}`
                </h3>
              </div>
              <button onClick={() => setIsInsertOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInsertSubmit} className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {tableData?.columns.map((col) => (
                <div key={col.name} className="space-y-1">
                  <label className="text-xs font-mono text-gray-300 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      {col.is_primary && <span className="text-[9px] text-amber-300 font-bold">PK</span>}
                      {col.name}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {col.type} {col.is_auto_increment ? '(Auto Increment)' : col.nullable ? '(Optional)' : '(Required)'}
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder={col.is_auto_increment ? 'Auto Generated' : `Enter ${col.name}...`}
                    value={insertValues[col.name] || ''}
                    onChange={(e) => setInsertValues({ ...insertValues, [col.name]: e.target.value })}
                    disabled={col.is_auto_increment}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 disabled:opacity-40"
                  />
                </div>
              ))}

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsInsertOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono text-gray-400 hover:text-white bg-white/5 border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInsert}
                  className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30 flex items-center gap-1.5"
                >
                  {isSubmittingInsert ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: EDIT ROW ----------------- */}
      {editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gray-950 border border-purple-500/40 rounded-2xl p-6 max-w-lg w-full shadow-2xl shadow-purple-500/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold font-mono text-white">
                  Edit Record in `{selectedTable}`
                </h3>
              </div>
              <button onClick={() => setEditingRow(null)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {tableData?.columns.map((col) => {
                const isPK = col.is_primary;
                return (
                  <div key={col.name} className="space-y-1">
                    <label className="text-xs font-mono text-gray-300 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        {isPK && <span className="text-[9px] text-amber-300 font-bold">PK (Locked)</span>}
                        {col.name}
                      </span>
                      <span className="text-[10px] text-gray-500">{col.type}</span>
                    </label>
                    <input
                      type="text"
                      value={editValues[col.name] !== undefined ? editValues[col.name] : ''}
                      onChange={(e) => setEditValues({ ...editValues, [col.name]: e.target.value })}
                      disabled={isPK}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 disabled:opacity-50 disabled:bg-black/50"
                    />
                  </div>
                );
              })}

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingRow(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono text-gray-400 hover:text-white bg-white/5 border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 flex items-center gap-1.5"
                >
                  {isSubmittingEdit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Update Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: DELETE CONFIRMATION ----------------- */}
      {deletingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gray-950 border border-rose-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-rose-500/10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono text-white">Confirm Deletion</h3>
                <p className="text-xs text-gray-400">
                  Delete record from table `{selectedTable}`
                </p>
              </div>
            </div>

            <div className="p-3 bg-black/60 rounded-xl border border-white/5 font-mono text-xs text-gray-300 space-y-1">
              <div>
                <span className="text-gray-500">Target Record: </span>
                <span className="text-rose-300 font-bold">
                  {tableData?.primary_key}: {deletingRow[tableData?.primary_key]}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 pt-1">
                This action executes a permanent parameterized DELETE on `{database}.{selectedTable}`.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingRow(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono text-gray-400 hover:text-white bg-white/5 border border-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={isSubmittingDelete}
                className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
              >
                {isSubmittingDelete ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
