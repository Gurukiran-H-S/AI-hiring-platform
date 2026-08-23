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
    <div className="space-y-8 w-full max-w-7xl mx-auto text-ink">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title text-ink font-display">
            🗄️ PostgreSQL Database Inspector & Schema Explorer
          </h1>
          <p className="text-ink-3 text-sm mt-1">
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
            <div key={i} className="skeleton h-28 rounded-xl"></div>
          ))}
        </div>
      ) : (
        <>
          {/* Database Summary Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6 text-center">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-ink-3 mb-1 font-display">Database Engine</div>
              <div className="text-2xl font-bold text-ok font-mono uppercase">{schemaData?.database_engine || 'PostgreSQL'}</div>
              <div className="text-[11px] text-ink-3 mt-1 truncate">{schemaData?.database_url}</div>
            </div>

            <div className="card p-6 text-center">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-ink-3 mb-1 font-display">Total Database Tables</div>
              <div className="text-4xl font-bold text-brand font-display my-1">{schemaData?.total_tables || 0}</div>
              <div className="text-[11px] text-ink-3">Relational PostgreSQL Tables</div>
            </div>

            <div className="card p-6 text-center">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-ink-3 mb-1 font-display">Selected Table</div>
              <div className="text-2xl font-bold text-warn font-mono my-1 truncate">{selectedTable || 'None'}</div>
              <div className="text-[11px] text-ink-3">{tableData?.row_count || 0} Records Loaded</div>
            </div>
          </div>

          {/* Database Tables Selector Grid */}
          <div className="card p-6 space-y-4">
            <h2 className="section-title font-display text-ink">Database Tables ({schemaData?.tables?.length || 0})</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {schemaData?.tables?.map((table) => (
                <button
                  key={table.table_name}
                  onClick={() => loadTableRecords(table.table_name)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    selectedTable === table.table_name
                      ? 'bg-brand-light border-brand text-ink shadow-sm'
                      : 'bg-page border-line text-ink-2 hover:bg-brand-subtle'
                  }`}
                >
                  <span className="font-mono text-xs font-semibold truncate">{table.table_name}</span>
                  <span className="text-[10px] bg-ok-bg px-2 py-0.5 rounded font-mono text-ok">
                    {table.row_count} rows
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Live Records Table Inspector */}
          {selectedTable && (
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h2 className="section-title font-display text-ink">
                  Live Table Inspection — <span className="font-mono text-brand">{selectedTable}</span>
                </h2>
                <span className="badge badge-green px-3 py-1 rounded-full font-mono">
                  PostgreSQL Real-Time Query
                </span>
              </div>

              {loadingTable ? (
                <div className="skeleton h-44 rounded-xl"></div>
              ) : !tableData || tableData.records?.length === 0 ? (
                <div className="empty-state text-xs">
                  No records stored in table '{selectedTable}' yet.
                </div>
              ) : (
                <div className="table-scroll max-h-[500px] overflow-y-auto">
                  <table className="data-table w-full text-left text-xs font-mono">
                    <thead className="bg-brand-subtle text-brand uppercase sticky top-0 border-b border-line">
                      <tr>
                        {tableData.columns?.map((col) => (
                          <th key={col} className="p-3 whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line text-ink-2">
                      {tableData.records.map((row, idx) => (
                        <tr key={idx} className="hover:bg-brand-subtle">
                          {tableData.columns.map((col) => (
                            <td key={col} className="p-3 whitespace-nowrap max-w-[200px] truncate" title={String(row[col])}>
                              {row[col] === null || row[col] === undefined ? (
                                <span className="text-ink-4 italic">null</span>
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
