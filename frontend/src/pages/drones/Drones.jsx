import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  applyModelToDroneForm,
  deleteDrone,
  getDroneRegistrationData,
  groupDronesByHangar,
  saveDrone,
  toDroneForm,
} from '../../services/droneService';
import { getErrorMessage } from '../../utils/errorMessage';
const initialForm = {
  name: '',
  autonomy: '',
  maxWeight: '',
  averageSpeed: '',
  hangarId: '',
  modelId: ''
};
const Drones = () => {
  const [drones, setDrones] = useState([]);
  const [hangars, setHangars] = useState([]);
  const [models, setModels] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getDroneRegistrationData();
      setDrones(data.drones);
      setModels(data.models);
      setHangars(data.hangars);
    } catch (err) {
      setError(getErrorMessage(err, 'Nao foi possivel carregar os drones.'));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadData();
  }, []);
  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };
  const handleChange = event => {
    const {
      name,
      value
    } = event.target;
    if (name === 'modelId') {
      setForm(current => applyModelToDroneForm(current, value, models));
      return;
    }
    setForm(current => ({
      ...current,
      [name]: value
    }));
  };
  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await saveDrone(editingId, form);
      resetForm();
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Nao foi possivel salvar o drone.'));
    } finally {
      setSaving(false);
    }
  };
  const handleEdit = drone => {
    setEditingId(drone.id);
    setForm(toDroneForm(drone));
  };
  const handleDelete = async id => {
    try {
      await deleteDrone(id);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Nao foi possivel excluir o drone.'));
    }
  };
  const dronesByHangar = groupDronesByHangar(hangars, drones);
  return <div className="[min-height:100%] [background:#f4f7fb] [color:#10233d]">
      <div className="[margin:0_auto]">
        <div className="[display:flex] [justify-content:space-between] [align-items:center] [margin-bottom:24px] [gap:16px]">
          <div>
            <h1 className="[margin:0]">Drones</h1>
            <p className="[margin:8px_0_0] [color:#58708d]">Cadastre manualmente ou importe dados de um modelo salvo.</p>
          </div>
          <Link to="/dashboard" className="[padding:10px_16px] [border-radius:10px] [background:#0f5bd7] [color:white] [text-decoration:none]">
            Voltar ao dashboard
          </Link>
        </div>

        {error && <div className="[margin-bottom:16px] [padding:12px_14px] [border-radius:10px] [background:#ffe3e3] [color:#9d1c1c]">{error}</div>}

        <div className="[display:grid] [grid-template-columns:1fr_1.1fr] [gap:20px]">
          <form onSubmit={handleSubmit} className="[background:white] [padding:24px] [border-radius:18px] [box-shadow:0_10px_30px_rgba(16,35,61,0.08)]">
            <h2 className="[margin-top:0]">{editingId ? 'Editar drone' : 'Novo drone'}</h2>

            <label className="[display:block] [margin-bottom:12px]">
              <span className="[display:block] [margin-bottom:6px]">Nome</span>
              <input name="name" value={form.name} onChange={handleChange} required className="[width:100%] [padding:12px] [border-radius:10px] [border:1px_solid_#d6deea]" />
            </label>

            <label className="[display:block] [margin-bottom:12px]">
              <span className="[display:block] [margin-bottom:6px]">Importar modelo salvo</span>
              <select name="modelId" value={form.modelId} onChange={handleChange} className="[width:100%] [padding:12px] [border-radius:10px] [border:1px_solid_#d6deea] [background:white]">
                <option value="">Preencher manualmente</option>
                {models.map(model => <option key={model.id} value={model.id}>{model.name}</option>)}
              </select>
            </label>

            <div className="[display:grid] [grid-template-columns:1fr_1fr] [gap:12px]">
              <label>
                <span className="[display:block] [margin-bottom:6px]">Autonomia</span>
                <input name="autonomy" type="number" step="0.01" value={form.autonomy} onChange={handleChange} required className="[width:100%] [padding:12px] [border-radius:10px] [border:1px_solid_#d6deea]" />
              </label>
              <label>
                <span className="[display:block] [margin-bottom:6px]">Peso Max</span>
                <input name="maxWeight" type="number" step="0.01" value={form.maxWeight} onChange={handleChange} required className="[width:100%] [padding:12px] [border-radius:10px] [border:1px_solid_#d6deea]" />
              </label>
            </div>

            <label className="[display:block] [margin-top:12px]">
              <span className="[display:block] [margin-bottom:6px]">Velocidade Media</span>
              <input name="averageSpeed" type="number" step="0.01" value={form.averageSpeed} onChange={handleChange} required className="[width:100%] [padding:12px] [border-radius:10px] [border:1px_solid_#d6deea]" />
            </label>

            <label className="[display:block] [margin-top:12px]">
              <span className="[display:block] [margin-bottom:6px]">Hangar armazenado</span>
              <select name="hangarId" value={form.hangarId} onChange={handleChange} required className="[width:100%] [padding:12px] [border-radius:10px] [border:1px_solid_#d6deea] [background:white]">
                <option value="">Selecione um hangar</option>
                {hangars.map(hangar => <option key={hangar.id} value={hangar.id}>{hangar.name}</option>)}
              </select>
            </label>

            <div className="[display:flex] [gap:10px] [margin-top:18px]">
              <button type="submit" disabled={saving} className="[flex:1] [padding:12px] [border:none] [border-radius:10px] [background:#0f5bd7] [color:white] [cursor:pointer]">
                {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Cadastrar'}
              </button>
              {editingId && <button type="button" onClick={resetForm} className="[padding:12px_16px] [border:1px_solid_#d6deea] [border-radius:10px] [background:white] [cursor:pointer]">
                  Cancelar
                </button>}
            </div>
          </form>

          <section className="[background:white] [padding:24px] [border-radius:18px] [box-shadow:0_10px_30px_rgba(16,35,61,0.08)]">
            <h2 className="[margin-top:0]">Seus drones</h2>
            {loading ? <p>Carregando...</p> : drones.length === 0 ? <p>Voce ainda nao cadastrou nenhum drone.</p> : <div className="[display:grid] [gap:16px]">
                {hangars.map(hangar => {
              const groupedDrones = dronesByHangar[hangar.id] || [];
              return <section key={hangar.id} className="[padding:18px] [border-radius:14px] [background:#f7f9fc]">
                      <div className="[display:flex] [justify-content:space-between] [align-items:center] [margin-bottom:12px]">
                        <div>
                          <h3 className="[margin:0]">{hangar.name}</h3>
                          <p className="[margin:4px_0_0] [color:#58708d]">Posicao: ({hangar.positionX}, {hangar.positionY})</p>
                        </div>
                        <span className="[padding:6px_10px] [border-radius:999px] [background:#dbeafe] [color:#0f5bd7] [font-weight:700]">
                          {groupedDrones.length} drone(s)
                        </span>
                      </div>

                      {groupedDrones.length === 0 ? <p className="[margin:0] [color:#58708d]">Nenhum drone armazenado neste hangar.</p> : <div className="[display:grid] [gap:10px]">
                          {groupedDrones.map(drone => <article key={drone.id} className="[padding:16px] [border-radius:12px] [background:white] [display:flex] [justify-content:space-between] [gap:12px]">
                              <div>
                                <div className="[font-weight:700]">{drone.name}</div>
                                <div className="[color:#58708d]">Autonomia: {drone.autonomy}</div>
                                <div className="[color:#58708d]">Peso Max: {drone.maxWeight}</div>
                                <div className="[color:#58708d]">Velocidade Media: {drone.averageSpeed}</div>
                              </div>
                              <div className="[display:flex] [gap:8px] [align-items:start]">
                                <button onClick={() => handleEdit(drone)} className="[padding:8px_12px] [border:none] [border-radius:8px] [background:#dbeafe] [cursor:pointer]">
                                  Editar
                                </button>
                                <button onClick={() => handleDelete(drone.id)} className="[padding:8px_12px] [border:none] [border-radius:8px] [background:#fee2e2] [cursor:pointer]">
                                  Excluir
                                </button>
                              </div>
                            </article>)}
                        </div>}
                    </section>;
            })}
              </div>}
          </section>
        </div>
      </div>
    </div>;
};
export default Drones;
