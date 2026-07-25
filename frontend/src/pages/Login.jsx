import React, { useContext, useState } from 'react';
import { Button, Card, Input } from '@heroui/react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) navigate('/dashboard/geral');
    else setError('Credenciais invalidas. Tente novamente.');
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#eef4ff] px-5 py-10">
      <div className="absolute -left-24 top-[-8rem] size-96 rounded-full bg-blue-500/15 blur-3xl" />
      <div className="absolute -bottom-36 right-[-5rem] size-[30rem] rounded-full bg-amber-400/20 blur-3xl" />
      <Card className="relative w-full max-w-md border border-white/70 bg-white/90 p-2 shadow-2xl shadow-blue-950/10 backdrop-blur-xl">
        <Card.Header className="flex-col items-start gap-3 px-7 pt-7">
          <div className="grid size-12 place-items-center rounded-2xl bg-ink text-xl text-white">
            <i className="bi bi-airplane-engines" />
          </div>
          <div>
            <Card.Title className="text-3xl font-extrabold tracking-tight text-ink">Bem-vindo</Card.Title>
            <Card.Description className="mt-1 text-slate-copy">Acesse o centro operacional de entregas.</Card.Description>
          </div>
        </Card.Header>
        <Card.Content className="px-7 py-6">
          {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><i className="bi bi-exclamation-circle mr-2" />{error}</div>}
          <form onSubmit={handleSubmit} className="grid gap-4">
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@empresa.com" aria-label="Email" required className="w-full" />
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Sua senha" aria-label="Senha" required className="w-full" />
            <Button type="submit" variant="primary" fullWidth isDisabled={loading} className="mt-2 bg-ocean text-white">
              {loading ? <><i className="bi bi-arrow-repeat animate-spin" /> Entrando...</> : <><i className="bi bi-box-arrow-in-right" /> Entrar</>}
            </Button>
          </form>
        </Card.Content>
        <Card.Footer className="justify-center border-t border-slate-100 px-7 py-5 text-sm text-slate-copy">
          Nao tem conta? <Link className="ml-1 font-bold text-ocean hover:underline" to="/register">Cadastre-se</Link>
        </Card.Footer>
      </Card>
    </main>
  );
};

export default Login;
