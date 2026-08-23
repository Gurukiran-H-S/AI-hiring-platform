import React, { useState, useEffect } from 'react'
import { api } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('')
  const [search, setSearch] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/users', {
        params: { role: roleFilter || undefined, search: search || undefined }
      })
      setUsers(data.users || [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load user accounts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [roleFilter])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchUsers()
  }

  const handleToggleStatus = async (userId) => {
    try {
      const { data } = await api.put(`/admin/users/${userId}/toggle-status`)
      toast.success(`User status updated to ${data.is_active ? 'Active' : 'Deactivated'}`)
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update user status.')
    }
  }

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto text-ink">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title text-ink font-display">
            👥 User Account Governance & Security
          </h1>
          <p className="text-ink-3 text-sm mt-1">
            Manage candidates, recruiters, and admin accounts, view verification states, and activate/deactivate access.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input rounded-xl p-2.5 text-xs font-semibold focus:border-brand"
          >
            <option value="">All Roles</option>
            <option value="candidate">Candidates</option>
            <option value="recruiter">Recruiters</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {/* Search Input */}
      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-full rounded-xl p-2.5 text-xs focus:border-brand"
          />
          <button type="submit" className="btn-primary px-5 py-2.5 text-xs font-semibold rounded-xl">
            Search
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="card p-6 space-y-4">
        <h2 className="section-title font-display text-ink">Registered Users ({users.length})</h2>

        {loading ? (
          <div className="skeleton h-44 rounded-xl"></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table w-full text-left text-xs">
              <thead className="bg-brand-subtle text-ink-3 uppercase">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Registered On</th>
                  <th className="p-3">OTP Verification</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-ink-2">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-brand-subtle">
                    <td className="p-3">
                      <div className="font-semibold text-ink">{u.full_name}</div>
                      <div className="text-[11px] text-ink-3">{u.email}</div>
                    </td>
                    <td className="p-3 uppercase font-mono font-bold text-brand">{u.role}</td>
                    <td className="p-3 text-ink-3">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      <span className={`badge ${u.is_verified ? 'badge-green' : 'badge-orange'} px-2 py-0.5 rounded text-[10px] font-mono font-bold`}>
                        {u.is_verified ? '✓ Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'} px-2 py-0.5 rounded text-[10px] font-mono font-bold`}>
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        className={u.is_active ? 'btn-danger btn-sm' : 'btn-success btn-sm'}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
