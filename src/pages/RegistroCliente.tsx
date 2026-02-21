import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function RegistroCliente() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!nombre.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    if (!email.trim()) {
      setError('El correo es obligatorio.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmarPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      await auth.registroCliente({
        nombre: nombre.trim(),
        apellido: apellido.trim() || undefined,
        email: email.trim(),
        password,
        telefono: telefono.trim() || undefined,
      });
      showToast('Cuenta creada correctamente. Ya puede iniciar sesión.', 'success');
      navigate('/login');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al registrar';
      setError(msg);
      if (msg.toLowerCase().includes('correo') || msg.toLowerCase().includes('email') || msg.toLowerCase().includes('duplicado')) {
        showToast('Ese correo ya está registrado.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-primary-600 mb-2">AMADS</h1>
        <h2 className="text-lg text-gray-700 text-center mb-6">Crear cuenta de cliente</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
            <input type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña * (mín. 6 caracteres)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" required minLength={6} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña *</label>
            <input type="password" value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2 px-4 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 disabled:opacity-50">
            {loading ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          ¿Ya tiene cuenta? <Link to="/login" className="text-primary-600 hover:underline">Iniciar sesión</Link>
        </p>
        <p className="mt-2 text-center text-sm text-gray-600">
          <Link to="/tienda" className="text-primary-600 hover:underline">Ver catálogo sin cuenta</Link>
        </p>
      </div>
    </div>
  );
}
