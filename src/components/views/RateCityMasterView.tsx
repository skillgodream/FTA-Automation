import React, { useState } from 'react';
import { useFta } from '../../context/FtaContext';
import { CityConfig, NavSection, RateConfig, UserRole } from '../../types/fta';
import { Save, Edit3, CheckCircle2, ArrowRight } from 'lucide-react';

export const RateCityMasterView: React.FC = () => {
  const {
    rates,
    cities,
    statements,
    updateRateConfig,
    updateCityConfig,
    setActiveSection,
    setActiveRole,
  } = useFta();

  const [activeTab, setActiveTab] = useState<'rates' | 'cities'>('rates');
  const [editingRate, setEditingRate] = useState<RateConfig | null>(null);
  const [editingCity, setEditingCity] = useState<CityConfig | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRate) return;
    await updateRateConfig(editingRate);
    setSavedNotice(`${editingRate.designation} updated & recalculated.`);
    setEditingRate(null);
  };

  const handleSaveCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCity) return;
    await updateCityConfig(editingCity);
    setSavedNotice(`${editingCity.cityName} updated & recalculated.`);
    setEditingCity(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[13px] font-medium text-[#6B7280]">
            Per-Meeting Rates, Outstation Allowances & Monthly Caps
          </div>
          <h1 className="text-[26px] font-semibold text-[#111827] tracking-tight mt-0.5">
            Rate & City Rules
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-white border border-[#E5E7EB] rounded-full">
            <button
              onClick={() => setActiveTab('rates')}
              className={`px-3.5 py-1 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
                activeTab === 'rates'
                  ? 'bg-[#09090B] text-white'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Rates ({rates.length})
            </button>
            <button
              onClick={() => setActiveTab('cities')}
              className={`px-3.5 py-1 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
                activeTab === 'cities'
                  ? 'bg-[#09090B] text-white'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Cities ({cities.length})
            </button>
          </div>

          <button
            onClick={() => {
              setActiveRole(UserRole.EMPLOYEE);
              setActiveSection(NavSection.EMPLOYEE_STATEMENTS);
            }}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-[#09090B] rounded-full hover:bg-[#1F2937] transition-colors cursor-pointer"
          >
            <span>Review Statements</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live Auto-Calculation Preview Across the 5 Employees */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-2.5 shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Live Auto-Calculation Engine (Pulled Meetings × City Tier Price =
          Amount)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {statements.map((st) => (
            <div
              key={st.id}
              className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-bold text-slate-900 truncate">
                  {st.employeeName}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {st.designation} · {st.baseCity}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-600">
                  {st.eligibleLocalMeetings} × ₹{st.localRate}
                  {st.outstationDays > 0 ? ` + ${st.outstationDays}d` : ''}
                </span>
                <span className="font-bold text-blue-600">
                  ₹{st.netAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs font-bold text-emerald-900">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>{savedNotice}</span>
        </div>
      )}

      {activeTab === 'rates' ? (
        <div className="space-y-4">
          {editingRate && (
            <form
              onSubmit={handleSaveRate}
              className="bg-white border-2 border-blue-500 rounded-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  {editingRate.designation}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingRate(null)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tier 1 (₹)
                  </label>
                  <input
                    type="number"
                    value={editingRate.tier1LocalRate}
                    onChange={(e) =>
                      setEditingRate({
                        ...editingRate,
                        tier1LocalRate: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tier 2 (₹)
                  </label>
                  <input
                    type="number"
                    value={editingRate.tier2LocalRate}
                    onChange={(e) =>
                      setEditingRate({
                        ...editingRate,
                        tier2LocalRate: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tier 3 (₹)
                  </label>
                  <input
                    type="number"
                    value={editingRate.tier3LocalRate}
                    onChange={(e) =>
                      setEditingRate({
                        ...editingRate,
                        tier3LocalRate: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Monthly Cap (₹)
                  </label>
                  <input
                    type="number"
                    value={editingRate.maxClaimLimit}
                    onChange={(e) =>
                      setEditingRate({
                        ...editingRate,
                        maxClaimLimit: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save & Auto-Recalculate</span>
                </button>
              </div>
            </form>
          )}

          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/50 text-[11px] font-semibold text-slate-400">
                    <th className="py-2.5 px-5">Designation</th>
                    <th className="py-2.5 px-4 text-right">Tier 1 Rate</th>
                    <th className="py-2.5 px-4 text-right">Tier 2 Rate</th>
                    <th className="py-2.5 px-4 text-right">Tier 3 Rate</th>
                    <th className="py-2.5 px-4 text-right">New Launch</th>
                    <th className="py-2.5 px-4 text-right">Special City</th>
                    <th className="py-2.5 px-4 text-right">Own Vehicle</th>
                    <th className="py-2.5 px-4 text-right">Max Cap</th>
                    <th className="py-2.5 px-5 text-right">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {rates.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-5 font-semibold text-slate-900">
                        {r.designation}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                        ₹{r.tier1LocalRate}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                        ₹{r.tier2LocalRate}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                        ₹{r.tier3LocalRate}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                        ₹{r.newLaunchRate}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800">
                        ₹{r.specialCityOutstationRate.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800">
                        ₹{r.ownVehicleTier1Rate} / ₹{r.ownVehicleTier23Rate}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                        ₹{r.maxClaimLimit.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <button
                          onClick={() => setEditingRate(r)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
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
      ) : (
        <div className="space-y-4">
          {editingCity && (
            <form
              onSubmit={handleSaveCity}
              className="bg-white border-2 border-blue-500 rounded-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  {editingCity.cityName}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingCity(null)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tier
                  </label>
                  <select
                    value={editingCity.tier}
                    onChange={(e) =>
                      setEditingCity({ ...editingCity, tier: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="Tier 1">Tier 1</option>
                    <option value="Tier 2">Tier 2</option>
                    <option value="Tier 3">Tier 3</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingCity.isSpecialCity}
                      onChange={(e) =>
                        setEditingCity({
                          ...editingCity,
                          isSpecialCity: e.target.checked,
                        })
                      }
                    />
                    <span className="font-bold text-slate-800">
                      Special City (₹1,200/Day)
                    </span>
                  </label>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingCity.isNewLaunchCity}
                      onChange={(e) =>
                        setEditingCity({
                          ...editingCity,
                          isNewLaunchCity: e.target.checked,
                        })
                      }
                    />
                    <span className="font-bold text-slate-800">
                      New Launch (₹50)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save & Auto-Recalculate</span>
                </button>
              </div>
            </form>
          )}

          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/50 text-[11px] font-semibold text-slate-400">
                    <th className="py-2.5 px-5">City</th>
                    <th className="py-2.5 px-4">Region</th>
                    <th className="py-2.5 px-4">Tier</th>
                    <th className="py-2.5 px-4">Special Outstation</th>
                    <th className="py-2.5 px-4">New Launch</th>
                    <th className="py-2.5 px-5 text-right">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {cities.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-5 font-semibold text-slate-900">
                        {c.cityName}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{c.region}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {c.tier}
                      </td>
                      <td className="py-3 px-4">
                        {c.isSpecialCity ? (
                          <span className="font-semibold text-blue-600">
                            ₹1,200/Day
                          </span>
                        ) : (
                          <span className="text-slate-400">Standard</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {c.isNewLaunchCity ? (
                          <span className="font-semibold text-emerald-700">
                            Active
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <button
                          onClick={() => setEditingCity(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
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
      )}
    </div>
  );
};
