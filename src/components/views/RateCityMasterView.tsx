import React, { useState } from 'react';
import { useFta } from '../../context/FtaContext';
import { CityConfig, RateConfig } from '../../types/fta';
import { AlertCircle, Save, Edit3, CheckCircle2 } from 'lucide-react';

export const RateCityMasterView: React.FC = () => {
  const { rates, cities, updateRateConfig, updateCityConfig } = useFta();

  const [editingRate, setEditingRate] = useState<RateConfig | null>(null);
  const [editingCity, setEditingCity] = useState<CityConfig | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRate) return;
    await updateRateConfig(editingRate);
    setSavedNotice(
      `Updated ${editingRate.designation} Rate Master and recalculated unlocked monthly statements.`
    );
    setEditingRate(null);
  };

  const handleSaveCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCity) return;
    await updateCityConfig(editingCity);
    setSavedNotice(
      `Updated ${editingCity.cityName} City Master configuration and recalculated unlocked monthly statements.`
    );
    setEditingCity(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="text-xs font-medium text-slate-500">
            Deterministic Tariff Matrix · Special City ₹1,200 · Own Vehicle ₹500/₹400 · New Launch ₹50 · Max Claim Caps
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Rate Master & City Master Configuration
          </h1>
        </div>
      </div>

      {/* Illustrative Tariff Governance Notice */}
      <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-between gap-4 text-xs text-amber-950">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            <strong>Policy Disclosure:</strong> All demonstration rates below (including Rahul Sharma's ₹50/meeting BD Manager rate) are marked as{' '}
            <strong>Illustrative — Pending Final HR Policy Sign-Off</strong>. Any modification immediately triggers deterministic recalculation on unlocked statements.
          </span>
        </div>
      </div>

      {savedNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs font-medium text-emerald-900">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Edit Rate Form */}
      {editingRate && (
        <form
          onSubmit={handleSaveRate}
          className="bg-white border border-blue-300 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-base font-semibold text-slate-900">
              Edit Designation Rate Config — {editingRate.designation}
            </h3>
            <button
              type="button"
              onClick={() => setEditingRate(null)}
              className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Tier 1 Local Rate (₹/mtg)
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Tier 2 Local Rate (₹/mtg)
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Tier 3 Local Rate (₹/mtg)
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                New Launch Rate (₹/mtg)
              </label>
              <input
                type="number"
                value={editingRate.newLaunchRate}
                onChange={(e) =>
                  setEditingRate({
                    ...editingRate,
                    newLaunchRate: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Special City Outstation (₹/day)
              </label>
              <input
                type="number"
                value={editingRate.specialCityOutstationRate}
                onChange={(e) =>
                  setEditingRate({
                    ...editingRate,
                    specialCityOutstationRate: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Own Vehicle Tier 1 (₹/day)
              </label>
              <input
                type="number"
                value={editingRate.ownVehicleTier1Rate}
                onChange={(e) =>
                  setEditingRate({
                    ...editingRate,
                    ownVehicleTier1Rate: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Own Vehicle Tier 2/3 (₹/day)
              </label>
              <input
                type="number"
                value={editingRate.ownVehicleTier23Rate}
                onChange={(e) =>
                  setEditingRate({
                    ...editingRate,
                    ownVehicleTier23Rate: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Max Monthly Claim Cap (₹)
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={!editingRate.isIllustrative}
                onChange={(e) =>
                  setEditingRate({
                    ...editingRate,
                    isIllustrative: !e.target.checked,
                    approvalStatus: e.target.checked
                      ? 'HR Policy Approved'
                      : 'Illustrative – Pending HR Policy Approval',
                  })
                }
              />
              <span>Mark this designation's rates as HR Policy Approved</span>
            </label>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Rate Config & Recalculate</span>
            </button>
          </div>
        </form>
      )}

      {/* 1. Designation Rate Master Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">
            01. Designation Rate Master & Maximum Claim Limits
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Local meeting tariffs by city tier, New Launch rate (₹50), Outstation daily rates, and monthly maximum caps.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-3 text-right">Tier 1 Local</th>
                <th className="py-3 px-3 text-right">Tier 2 Local</th>
                <th className="py-3 px-3 text-right">Tier 3 Local</th>
                <th className="py-3 px-3 text-right">New Launch</th>
                <th className="py-3 px-3 text-right">Special City Out</th>
                <th className="py-3 px-3 text-right">Own Veh T1 / T2-3</th>
                <th className="py-3 px-3 text-right">Max Claim Limit</th>
                <th className="py-3 px-3">Governance Status</th>
                <th className="py-3 px-4 text-right">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {rates.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {r.designation}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                    ₹{r.tier1LocalRate}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                    ₹{r.tier2LocalRate}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                    ₹{r.tier3LocalRate}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                    ₹{r.newLaunchRate}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800">
                    ₹{r.specialCityOutstationRate.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800">
                    ₹{r.ownVehicleTier1Rate} / ₹{r.ownVehicleTier23Rate}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                    ₹{r.maxClaimLimit.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`font-medium ${
                        r.isIllustrative ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {r.approvalStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setEditingRate(r)}
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

      {/* Edit City Modal */}
      {editingCity && (
        <form
          onSubmit={handleSaveCity}
          className="bg-white border border-blue-300 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-base font-semibold text-slate-900">
              Edit City Master — {editingCity.cityName} ({editingCity.state})
            </h3>
            <button
              type="button"
              onClick={() => setEditingCity(null)}
              className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                City Tier Classification
              </label>
              <select
                value={editingCity.tier}
                onChange={(e) =>
                  setEditingCity({ ...editingCity, tier: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
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
                <span className="font-medium text-slate-800">
                  Special City (₹1,200/day Outstation Rate)
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
                <span className="font-medium text-slate-800">
                  New Launch City (₹50/mtg · Outstation Rule Applies)
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save City Configuration</span>
            </button>
          </div>
        </form>
      )}

      {/* 2. City Master Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">
            02. City Master & Special/New-Launch Classification ({cities.length}{' '}
            Cities)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Controls Tier 1/2/3 local meeting rates, Special City ₹1,200 outstation eligibility, and New-City Outstation Rule enforcement.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                <th className="py-3 px-4">City ID</th>
                <th className="py-3 px-3">City Name · State</th>
                <th className="py-3 px-3">Region</th>
                <th className="py-3 px-3">Tier Classification</th>
                <th className="py-3 px-3">Special City (₹1,200/day)</th>
                <th className="py-3 px-3">New Launch Territory (₹50/mtg)</th>
                <th className="py-3 px-4 text-right">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {cities.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                    {c.id}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-900">
                      {c.cityName}
                    </span>{' '}
                    <span className="text-slate-500">· {c.state}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-700">{c.region}</td>
                  <td className="py-3 px-3 font-medium text-slate-900">
                    {c.tier}
                  </td>
                  <td className="py-3 px-3">
                    {c.isSpecialCity ? (
                      <span className="font-semibold text-blue-700">
                        Yes (₹1,200/day)
                      </span>
                    ) : (
                      <span className="text-slate-500">Standard Tier Rate</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {c.isNewLaunchCity ? (
                      <span className="font-semibold text-emerald-700">
                        Active New Launch
                      </span>
                    ) : (
                      <span className="text-slate-500">Established City</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setEditingCity(c)}
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
