import React, { useState } from 'react';
import { useFta } from '../../context/FtaContext';
import { Employee } from '../../types/fta';
import { UserPlus, Edit3, Check, X } from 'lucide-react';

export const EmployeeMasterView: React.FC = () => {
  const { employees, cities, updateEmployeeMaster, createEmployeeMaster } =
    useFta();

  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const [newEmpForm, setNewEmpForm] = useState({
    id: `EMP-100${employees.length + 1}`,
    name: '',
    email: '',
    designation: 'BD Executive',
    department: 'BD',
    baseCity: 'Mumbai',
    cityCategory: 'Tier 1',
    reportingManager: 'Vikramaditya Rao',
    baOwner: 'Priya Nair (BA - BD West)',
    baRegion: 'West',
    sourceTool: 'Prowl',
    ownVehicleEligible: true,
    status: 'Active',
  });

  const filteredEmployees = employees.filter((e) => {
    if (deptFilter !== 'ALL' && e.department !== deptFilter) return false;
    return true;
  });

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;
    await updateEmployeeMaster(editingEmp);
    setEditingEmp(null);
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpForm.name.trim() || !newEmpForm.email.trim()) return;
    await createEmployeeMaster(newEmpForm);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Apple-Style Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            5 Active Field Profiles · BA Ownership
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Employees
          </h1>
        </div>

        <button
          onClick={() => {
            setNewEmpForm((prev) => ({
              ...prev,
              id: `EMP-100${employees.length + 1}`,
            }));
            setShowAddModal((prev) => !prev);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Add Employee Drawer */}
      {showAddModal && (
        <form
          onSubmit={handleCreateEmployee}
          className="bg-white border-2 border-blue-500 rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900">New Employee</h3>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">ID</label>
              <input
                type="text"
                value={newEmpForm.id}
                onChange={(e) =>
                  setNewEmpForm({ ...newEmpForm, id: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={newEmpForm.name}
                onChange={(e) =>
                  setNewEmpForm({ ...newEmpForm, name: e.target.value })
                }
                placeholder="Full Name"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={newEmpForm.email}
                onChange={(e) =>
                  setNewEmpForm({ ...newEmpForm, email: e.target.value })
                }
                placeholder="email@enterprise-fta.in"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Designation
              </label>
              <select
                value={newEmpForm.designation}
                onChange={(e) =>
                  setNewEmpForm({ ...newEmpForm, designation: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                <option value="BD Manager">BD Manager</option>
                <option value="Operations Lead">Operations Lead</option>
                <option value="B2B Sales Manager">B2B Sales Manager</option>
                <option value="Super Hero">Super Hero</option>
                <option value="Regional Trainer">Regional Trainer</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 cursor-pointer"
            >
              Save
            </button>
          </div>
        </form>
      )}

      {/* Edit Employee Drawer */}
      {editingEmp && (
        <form
          onSubmit={handleSaveEdit}
          className="bg-white border-2 border-blue-500 rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              {editingEmp.name} ({editingEmp.id})
            </h3>
            <button
              type="button"
              onClick={() => setEditingEmp(null)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-900 cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Designation
              </label>
              <select
                value={editingEmp.designation}
                onChange={(e) =>
                  setEditingEmp({ ...editingEmp, designation: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                <option value="BD Manager">BD Manager</option>
                <option value="Operations Lead">Operations Lead</option>
                <option value="B2B Sales Manager">B2B Sales Manager</option>
                <option value="Super Hero">Super Hero</option>
                <option value="Regional Trainer">Regional Trainer</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Base City
              </label>
              <select
                value={editingEmp.baseCity}
                onChange={(e) => {
                  const cityObj = cities.find(
                    (c) => c.cityName === e.target.value
                  );
                  setEditingEmp({
                    ...editingEmp,
                    baseCity: e.target.value,
                    cityCategory: cityObj
                      ? cityObj.tier
                      : editingEmp.cityCategory,
                  });
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                {cities.map((c) => (
                  <option key={c.id} value={c.cityName}>
                    {c.cityName} ({c.tier})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Assigned BA
              </label>
              <input
                type="text"
                value={editingEmp.baOwner}
                onChange={(e) =>
                  setEditingEmp({ ...editingEmp, baOwner: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Own Vehicle
              </label>
              <select
                value={editingEmp.ownVehicleEligible ? 'YES' : 'NO'}
                onChange={(e) =>
                  setEditingEmp({
                    ...editingEmp,
                    ownVehicleEligible: e.target.value === 'YES',
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                <option value="YES">Eligible</option>
                <option value="NO">No</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 cursor-pointer"
            >
              Save & Recalculate
            </button>
          </div>
        </form>
      )}

      {/* Employee Directory Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
            {[
              'ALL',
              'BD',
              'Operations',
              'B2B Sales',
              'Super Heroes',
              'Functional Leads',
            ].map((dept) => (
              <button
                key={dept}
                onClick={() => setDeptFilter(dept)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  deptFilter === dept
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {dept === 'ALL' ? `All (${employees.length})` : dept}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-6">Employee</th>
                <th className="py-3 px-4">Role · Dept</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">BA Owner</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-6 text-right">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-6">
                    <div className="font-bold text-slate-900">{emp.name}</div>
                    <div className="text-[11px] font-mono text-slate-400">
                      {emp.id}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">
                      {emp.designation}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {emp.department}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    {emp.baseCity} ({emp.cityCategory})
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">
                    {emp.baOwner.split(' (')[0]}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {emp.sourceTool}
                  </td>
                  <td className="py-3.5 px-4">
                    {emp.ownVehicleEligible ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                        <Check className="w-3.5 h-3.5" /> Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400">
                        <X className="w-3.5 h-3.5" /> No
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <button
                      onClick={() => setEditingEmp(emp)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
