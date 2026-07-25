import React, { useContext, useState } from 'react';
import { Button, Card, Input } from '@heroui/react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    const registered = await register(name, email, password);
    setLoading(false);
    if (registered) {
      setSuccess('Cadastro realizado. Redirecionando para o login...');
      window.setTimeout(() => navigate('/login'), 2000);
    } else {
      setError('Nao foi possivel cadastrar. Verifique se o email ja esta em uso.');
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#eef4ff] px-5 py-10">
      <div className="absolute -right-24 top-[-8rem] size-96 rounded-full bg-blue-500/15 blur-3xl" />
      <div className="absolute -bottom-36 left-[-5rem] size-[30rem] rounded-full bg-amber-400/20 blur-3xl" />
      <Card className="relative w-full max-w-md border border-white/70 bg-white/90 p-2 shadow-2xl shadow-blue-950/10 backdrop-blur-xl">
        <Card.Header className="flex-col items-start gap-3 px-7 pt-7">
          <div className="grid size-12 place-items-center rounded-2xl bg-ink text-xl text-white"><i className="bi bi-person-plus" /></div>
          <div>
            <Card.Title className="text-3xl font-extrabold tracking-tight text-ink">Criar conta</Card.Title>
            <Card.Description className="mt-1 text-slate-copy">Configure seu ambiente operacional.</Card.Description>
          </div>
        </Card.Header>
        <Card.Content className="px-7 py-6">
          {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><i className="bi bi-exclamation-circle mr-2" />{error}</div>}
          {success && <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><i className="bi bi-check-circle mr-2" />{success}</div>}
          <form onSubmit={handleSubmit} className="grid gap-4">
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome completo" aria-label="Nome" required />
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@empresa.com" aria-label="Email" required />
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Crie uma senha" aria-label="Senha" required />
            <Button type="submit" variant="primary" fullWidth isDisabled={loading} className="mt-2 bg-ocean text-white">
              {loading ? <><i className="bi bi-arrow-repeat animate-spin" /> Cadastrando...</> : <><i className="bi bi-person-check" /> Cadastrar</>}
            </Button>
          </form>
        </Card.Content>
        <Card.Footer className="justify-center border-t border-slate-100 px-7 py-5 text-sm text-slate-copy">
          Ja possui conta? <Link className="ml-1 font-bold text-ocean hover:underline" to="/login">Fazer login</Link>
        </Card.Footer>
      </Card>
    </main>
  );
};

export default Register;
