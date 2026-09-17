import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout.jsx';
import { Field } from '../components/Field.jsx';
import { api, apiMessage } from '../api/client.js';
import { useAuthStore } from '../store/authStore.js';

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState } = useForm({
    defaultValues: { email: 'demo@neuroflow.ai', password: 'Password@123' }
  });

  async function onSubmit(values) {
    setError('');
    try {
      const { data } = await api.post('/auth/login', values);
      setSession(data);
      navigate('/');
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  return (
    <AuthLayout title="Sign in" subtitle="Open your document intelligence workspace.">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Field label="Email" type="email" {...register('email', { required: 'Email is required' })} />
        <Field
          label="Password"
          type="password"
          {...register('password', { required: 'Password is required' })}
        />
        {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={formState.isSubmitting}
          className="focus-ring w-full rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          Sign in
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        Need an account? <Link className="font-medium text-accent" to="/register">Register</Link>
      </p>
    </AuthLayout>
  );
}
