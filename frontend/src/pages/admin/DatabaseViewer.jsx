import React, { useState, useEffect } from 'react'
import { api } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export const DatabaseViewer = () => {
  const [schemaData, setSchemaData] = useState(null)
  const [selectedTable, setSelectedTable] = useState('')
  const [tableData, setTableData] = useState(null)
  const [loadingSchema, setLoadingSchema] = useState(true)
  const [loadingTable, setLoadingTable] = useState(false)

  const fetchSchema = async () => {
    try {
      const { data } = await api.get('/admin/database-schema')
      setSchemaData(data)
      if (data.tables?.length > 0) {
        loadTableRecords(data.tables[0].table_name)
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to load database schema.')
    } finally {
      setLoadingSchema(false)
    }
  }

  useEffect(() => {
    fetchSchema()
  }, [])

  const loadTableRecords = async (tableName) => {
    setSelectedTable(tableName)
    setLoadingTable(true)
    try {
      const { data } = await api.get(`/admin/database-data/${tableName}`)
      setTableData(data)
    } catch (err) {
      console.error(err)
      toast.error(`Failed to load records for table ${tableName}.`)
    } finally {
      setLoadingTable(false)
    }
  }

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent font-display">
            🗄️ PostgreSQL Database Inspector & Schema Explorer
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Live database inspector for project evaluation, faculty demonstration, table schemas, and live record inspection.
          </p>
        </div>

        <button
          onClick={fetchSchema}
          className="btn-secondary py-2 px-4 text-xs font-semibold rounded-xl flex items-center gap-2"
        >
          🔄 Refresh Database
        </button>
      </div>

      {loadingSchema ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <>
          {/* Database Summary Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 text-center">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-display">Database Engine</div>
              <div className="text-2xl font-extrabold text-emerald-400 font-mono uppercase">{schemaData?.database_engine || 'PostgreSQL'}</div>
              <div className="text-[11px] text-slate-500 mt-1 truncate">{schemaData?.database_url}</div>
            </div>

            <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 text-center">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-display">Total Database Tables</div>
              <div className="text-4xl font-extrabold text-indigo-400 font-display my-1">{schemaData?.total_tables || 0}</div>
              <div className="text-[11px] text-slate-500">Relational PostgreSQL Tables</div>
            </div>

            <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 text-center">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-display">Selected Table</div>
              <div className="text-2xl font-extrabold text-amber-400 font-mono my-1 truncate">{selectedTable || 'None'}</div>
              <div className="text-[11px] text-slate-500">{tableData?.row_count || 0} Records Loaded</div>
            </div>
          </div>

          {/* Database Tables Selector Grid */}
          <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 space-y-4">
            <h2 className="text-md font-bold font-display text-white">Database Tables ({schemaData?.tables?.length || 0})</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {schemaData?.tables?.map((table) => (
                <button
                  key={table.table_name}
                  onClick={() => loadTableRecords(table.table_name)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    selectedTable === table.table_name
                      ? 'bg-indigo-500/20 border-indigo-500 text-white shadow'
                      : 'bg-black/30 border-white/5 text-slate-400 hover:bg-white/5'
                  }`}
                >
                  <span className="font-mono text-xs font-semibold truncate">{table.table_name}</span>
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-mono text-emerald-400">
                    {table.row_count} rows
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Live Records Table Inspector */}
          {selectedTable && (
            <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h2 className="text-lg font-bold font-display text-white">
                  Live Table Inspection — <span className="font-mono text-indigo-400">{selectedTable}</span>
                </h2>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30 font-mono">
                  PostgreSQL Real-Time Query
                </span>
              </div>

              {loadingTable ? (
                <div className="h-44 bg-white/5 rounded-2xl animate-pulse"></div>
              ) : !tableData || tableData.records?.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No records stored in table '{selectedTable}' yet.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-black/60 text-indigo-300 uppercase sticky top-0 border-b border-white/10">
                      <tr>
                        {tableData.columns?.map((col) => (
                          <th key={col} className="p-3 whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {tableData.records.map((row, idx) => (
                        <tr key={idx} className="hover:bg-white/5">
                          {tableData.columns.map((col) => (
                            <td key={col} className="p-3 whitespace-nowrap max-w-[200px] truncate" title={String(row[col])}>
                              {row[col] === null || row[col] === undefined ? (
                                <span className="text-slate-600 italic">null</span>
                              ) : typeof row[col] === 'object' ? (
                                JSON.stringify(row[col])
                              ) : (
                                String(row[col])
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
