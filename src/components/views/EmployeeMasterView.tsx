import React, { useState } from 'react';
import { useFta } from '../../context/FtaContext';
import { Employee } from '../../types/fta';
import { UserPlus, Edit3, Search, Check, X } from 'lucide-react';

export const EmployeeMasterView: React.FC = () => {
  const { employees, cities, updateEmployeeMaster, createEmployeeMaster } =
    useFta();

  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const [newEmpForm, setNewEmpForm] = useState({
    id: `EMP-10${employees.length + 1}`,
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
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.id.toLowerCase().includes(q) ||
        e.name.toLowerCase().includes(q) ||
        e.designation.toLowerCase().includes(q) ||
        e.baseCity.toLowerCase().includes(q) ||
        e.baOwner.toLowerCase().includes(q)
      );
    }
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="text-xs font-medium text-slate-500">
            20 Field Employees · BD, Operations, B2B Sales, Super Heroes & Functional Leads (Incl. Regional Trainers)
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Employee Master & BA Routing Directory
          </h1>
        </div>

        <button
          onClick={() => {
            setNewEmpForm((prev) => ({
              ...prev,
              id: `EMP-10${employees.length + 1}`,
            }));
            setShowAddModal((prev) => !prev);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add Field Employee</span>
        </button>
      </div>

      {/* Add Employee Form Drawer */}
      {showAddModal && (
        <form
          onSubmit={handleCreateEmployee}
          className="bg-white border border-blue-300 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-base font-semibold text-slate-900">
              Add New Employee to Master Directory
            </h3>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Employee ID
              </label>
              <input
                type="text"
                value={newEmpForm.id}
                onChange={(e) =>
                  setNewEmpForm({ ...newEmpForm, id: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={newEmpForm.name}
                onChange={(e) =>
                  setNewEmpForm({ ...newEmpForm, name: e.target.value })
                }
                placeholder="e.g. Vivek Kulkarni"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Corporate Email
              </label>
              <input
                type="email"
                value={newEmpForm.email}
                onChange={(e) =>
                  setNewEmpForm({ ...newEmpForm, email: e.target.value })
                }
                placeholder="vivek.kulkarni@enterprise-fta.in"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Designation
              </label>
              <select
                value={newEmpForm.designation}
                onChange={(e) =>
                  setNewEmpForm({ ...newEmpForm, designation: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="BD Manager">BD Manager</option>
                <option value="BD Executive">BD Executive</option>
                <option value="Operations Lead">Operations Lead</option>
                <option value="B2B Sales Manager">B2B Sales Manager</option>
                <option value="Super Hero">Super Hero</option>
                <option value="Regional Trainer">Regional Trainer</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Department
              </label>
              <select
                value={newEmpForm.department}
                onChange={(e) =>
                  setNewEmpForm({ ...newEmpForm, department: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="BD">BD</option>
                <option value="Operations">Operations</option>
                <option value="B2B Sales">B2B Sales</option>
                <option value="Super Heroes">Super Heroes</option>
                <option value="Functional Leads">Functional Leads</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Base City
              </label>
              <select
                value={newEmpForm.baseCity}
                onChange={(e) => {
                  const cityObj = cities.find(
                    (c) => c.cityName === e.target.value
                  );
                  setNewEmpForm({
                    ...newEmpForm,
                    baseCity: e.target.value,
                    cityCategory: cityObj ? cityObj.tier : 'Tier 1',
                  });
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                {cities.map((c) => (
                  <option key={c.id} value={c.cityName}>
                    {c.cityName} ({c.tier})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Assigned BA Owner
              </label>
              <input
                type="text"
                value={newEmpForm.baOwner}
                onChange={(e) =>
                  setNewEmpForm({ ...newEmpForm, baOwner: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Source Tool
              </label>
              <select
                value={newEmpForm.sourceTool}
                onChange={(e) =>
                  setNewEmpForm({ ...newEmpForm, sourceTool: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Prowl">Prowl</option>
                <option value="LeadSquared">LeadSquared</option>
                <option value="Google Sheet CSV">Google Sheet CSV</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              Save Employee & Initialize Statement
            </button>
          </div>
        </form>
      )}

      {/* Edit Employee Drawer */}
      {editingEmp && (
        <form
          onSubmit={handleSaveEdit}
          className="bg-white border border-blue-300 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-base font-semibold text-slate-900">
              Edit Employee Master Record — {editingEmp.name} ({editingEmp.id})
            </h3>
            <button
              type="button"
              onClick={() => setEditingEmp(null)}
              className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Designation
              </label>
              <select
                value={editingEmp.designation}
                onChange={(e) =>
                  setEditingEmp({ ...editingEmp, designation: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="BD Manager">BD Manager</option>
                <option value="BD Executive">BD Executive</option>
                <option value="Operations Lead">Operations Lead</option>
                <option value="B2B Sales Manager">B2B Sales Manager</option>
                <option value="Super Hero">Super Hero</option>
                <option value="Regional Trainer">Regional Trainer</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
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
                    cityCategory: cityObj ? cityObj.tier : editingEmp.cityCategory,
                  });
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                {cities.map((c) => (
                  <option key={c.id} value={c.cityName}>
                    {c.cityName} ({c.tier})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Assigned BA Owner
              </label>
              <input
                type="text"
                value={editingEmp.baOwner}
                onChange={(e) =>
                  setEditingEmp({ ...editingEmp, baOwner: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Own-Vehicle Outstation Eligibility
              </label>
              <select
                value={editingEmp.ownVehicleEligible ? 'YES' : 'NO'}
                onChange={(e) =>
                  setEditingEmp({
                    ...editingEmp,
                    ownVehicleEligible: e.target.value === 'YES',
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="YES">Eligible (₹500 T1 / ₹400 T2-3)</option>
                <option value="NO">Not Eligible (Standard Rate Only)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditingEmp(null)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              Save Changes & Recalculate Statement
            </button>
          </div>
        </form>
      )}

      {/* Employee Master Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
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
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  deptFilter === dept
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {dept === 'ALL' ? `All (${employees.length})` : dept}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee, city, BA..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                <th className="py-3 px-4">Emp ID</th>
                <th className="py-3 px-3">Employee & Email</th>
                <th className="py-3 px-3">Designation · Department</th>
                <th className="py-3 px-3">Base City · Category</th>
                <th className="py-3 px-3">Reporting Manager · BA Owner</th>
                <th className="py-3 px-3">Source Tool</th>
                <th className="py-3 px-3">Own Vehicle</th>
                <th className="py-3 px-4 text-right">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                    {emp.id}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">{emp.name}</div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {emp.email}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-medium text-slate-900">
                      {emp.designation}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {emp.department}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-700">
                    {emp.baseCity} ·{' '}
                    <span className="font-medium text-slate-900">
                      {emp.cityCategory}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-slate-800">
                      Mgr: {emp.reportingManager}
                    </div>
                    <div className="text-[11px] text-blue-700 font-medium">
                      {emp.baOwner}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`font-medium ${
                        emp.sourceTool === 'Google Sheet CSV'
                          ? 'text-amber-800'
                          : 'text-slate-800'
                      }`}
                    >
                      {emp.sourceTool}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {emp.ownVehicleEligible ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <Check className="w-3.5 h-3.5" /> Eligible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400">
                        <X className="w-3.5 h-3.5" /> No
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setEditingEmp(emp)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
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
