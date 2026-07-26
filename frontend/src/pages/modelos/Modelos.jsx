import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  deleteModel,
  listModels,
  saveModel,
  toModelForm,
} from '../../services/modelService';
import { getErrorMessage } from '../../utils/errorMessage';
const initialForm = {
  name: '',
  autonomy: '',
  maxWeight: '',
  averageSpeed: ''
};
const Modelos = () => {
  const [models, setModels] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const loadModels = async () => {
    setLoading(true);
    try {
      setModels(await listModels());
    } catch (err) {
      setError(getErrorMessage(err, 'Nao foi possivel carregar os modelos.'));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadModels();
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
      await saveModel(editingId, form);
      resetForm();
      await loadModels();
    } catch (err) {
      setError(getErrorMessage(err, 'Nao foi possivel salvar o modelo.'));
    } finally {
      setSaving(false);
    }
  };
  const handleEdit = model => {
    setEditingId(model.id);
    setForm(toModelForm(model));
  };
  const handleDelete = async id => {
    try {
      await deleteModel(id);
      await loadModels();
    } catch (err) {
      setError(getErrorMessage(err, 'Nao foi possivel excluir o modelo.'));
    }
  };
  return <div className="[min-height:100%] [background:#f4f7fb] [color:#10233d]">
      <div className="[max-width:1120px] [margin:0_auto]">
        <div className="[display:flex] [justify-content:space-between] [align-items:center] [margin-bottom:24px] [gap:16px]">
          <div>
            <h1 className="[margin:0]">Modelos</h1>
            <p className="[margin:8px_0_0] [color:#58708d]">Cadastre os modelos de drone do seu operador.</p>
          </div>
          <Link to="/dashboard" className="[padding:10px_16px] [border-radius:10px] [background:#0f5bd7] [color:white] [text-decoration:none]">
            Voltar ao dashboard
          </Link>
        </div>

        {error && <div className="[margin-bottom:16px] [padding:12px_14px] [border-radius:10px] [background:#ffe3e3] [color:#9d1c1c]">{error}</div>}

        <div className="[display:grid] [grid-template-columns:1fr_1.1fr] [gap:20px]">
          <form onSubmit={handleSubmit} className="[background:white] [padding:24px] [border-radius:18px] [box-shadow:0_10px_30px_rgba(16,35,61,0.08)]">
            <h2 className="[margin-top:0]">{editingId ? 'Editar modelo' : 'Novo modelo'}</h2>
            <label className="[display:block] [margin-bottom:12px]">
              <span className="[display:block] [margin-bottom:6px]">Nome</span>
              <input name="name" value={form.name} onChange={handleChange} required className="[width:100%] [padding:12px] [border-radius:10px] [border:1px_solid_#d6deea]" />
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
            <h2 className="[margin-top:0]">Seus modelos</h2>
            {loading ? <p>Carregando...</p> : models.length === 0 ? <p>Você ainda não cadastrou nenhum modelo.</p> : <div className="internal-scroll-list [display:grid] [gap:12px]">
                {models.map(model => <article key={model.id} className="[padding:16px] [border-radius:12px] [background:#f7f9fc] [display:flex] [justify-content:space-between] [gap:12px]">
                    <div>
                      <div className="[font-weight:700]">{model.name}</div>
                      <div className="[color:#58708d]">Autonomia: {model.autonomy}</div>
                      <div className="[color:#58708d]">Peso Max: {model.maxWeight}</div>
                      <div className="[color:#58708d]">Velocidade Media: {model.averageSpeed}</div>
                    </div>
                    <div className="[display:flex] [gap:8px] [align-items:start]">
                      <button onClick={() => handleEdit(model)} className="[padding:8px_12px] [border:none] [border-radius:8px] [background:#dbeafe] [cursor:pointer]">
                        Editar
                      </button>
                      <button onClick={() => handleDelete(model.id)} className="[padding:8px_12px] [border:none] [border-radius:8px] [background:#fee2e2] [cursor:pointer]">
                        Excluir
                      </button>
                    </div>
                  </article>)}
              </div>}
          </section>
        </div>
      </div>
    </div>;
};
export default Modelos;
