import React from 'react';
import { calculateDIN } from '../utils/din';

const SKILL_OPTIONS = [
  { value: 'elso_sielo', label: '⛷ Első síelő — soha nem síeltem még' },
  { value: 'kezdo',      label: '🟢 Kezdő — néhányszor síeltem' },
  { value: 'kozephalado',label: '🔵 Középhaladó — rendszeresen síelek' },
  { value: 'halado',     label: '🔴 Haladó — magabiztosan síelek nehéz pályákon' },
  { value: 'profi',      label: '⚫ Profi — versenyszerű vagy szakértő szint' },
];

export default function RenterForm({ index, data, onChange, onRemove, canRemove }) {
  const update = (field, value) => {
    const updated = { ...data, [field]: value };
    // DIN live számítás
    const { weight_kg, height_cm, age, skill_level, shoe_size } = updated;
    if (weight_kg && height_cm && age && skill_level && shoe_size) {
      updated.din_value = calculateDIN(
        Number(weight_kg), Number(height_cm),
        Number(age), skill_level, Number(shoe_size)
      );
    } else {
      updated.din_value = null;
    }
    onChange(updated);
  };

  const din = data.din_value;

  return (
    <div className="renter-card">
      <div className="renter-card__header">
        <span className="renter-card__num">🎿 {index + 1}. bérlő</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {din !== null && din !== undefined && (
            <span className="din-badge">
              DIN: {din.toFixed(2)}
            </span>
          )}
          {canRemove && (
            <button
              type="button"
              className="btn btn--ghost"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
              onClick={onRemove}
            >
              ✕ Eltávolít
            </button>
          )}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Teljes neve <span className="required">*</span></label>
        <input
          className="form-input"
          type="text"
          placeholder="pl. Kovács Anna"
          value={data.name || ''}
          onChange={e => update('name', e.target.value)}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Életkor <span className="required">*</span></label>
          <input
            className="form-input"
            type="number"
            min="3" max="99"
            placeholder="pl. 35"
            value={data.age || ''}
            onChange={e => update('age', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Lábméret (EU) <span className="required">*</span></label>
          <input
            className="form-input"
            type="number"
            min="25" max="50"
            step="0.5"
            placeholder="pl. 42"
            value={data.shoe_size || ''}
            onChange={e => update('shoe_size', e.target.value)}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Magasság (cm) <span className="required">*</span></label>
          <input
            className="form-input"
            type="number"
            min="80" max="220"
            placeholder="pl. 175"
            value={data.height_cm || ''}
            onChange={e => update('height_cm', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Testsúly (kg) <span className="required">*</span></label>
          <input
            className="form-input"
            type="number"
            min="15" max="200"
            placeholder="pl. 75"
            value={data.weight_kg || ''}
            onChange={e => update('weight_kg', e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Sítudás szintje <span className="required">*</span></label>
        <div className="select-wrapper">
          <select
            className="form-select"
            value={data.skill_level || ''}
            onChange={e => update('skill_level', e.target.value)}
          >
            <option value="">— Válasszon —</option>
            {SKILL_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        {din !== null && din !== undefined && (
          <p className="form-hint">
            Az ISO 11088 szabvány alapján számított beállítási érték: <strong>DIN {din.toFixed(2)}</strong>
            {' '}(biztonsági célból csökkentve: 2,01–4,00 között −0,5; 4,01 felett −1,0)
          </p>
        )}
      </div>
    </div>
  );
}
