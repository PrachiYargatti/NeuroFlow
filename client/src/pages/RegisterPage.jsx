import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout.jsx';
import { Field } from '../components/Field.jsx';
import { api, apiMessage } from '../api/client.js';
import { useAuthStore } from '../store/authStore.js';

export function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState } = useForm();

  async function onSubmit(values) {
    setError('');
    try {
      const { data } = await api.post('/auth/register', values);
      setSession(data);
      navigate('/');
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  return (
    <AuthLayout title="Create account" subtitle="Start a local-first AI document workspace.">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Field label="Name" {...register('name', { required: 'Name is required' })} error={formState.errors.name} />
        <Field
          label="Email"
          type="email"
          {...register('email', { required: 'Email is required' })}
          error={formState.errors.email}
        />
        <Field
          label="Password"
          type="password"
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 6, message: 'Use at least 6 characters' }
          })}
          error={formState.errors.password}
        />
        {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={formState.isSubmitting}
          className="focus-ring w-full rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          Register
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        Already registered? <Link className="font-medium text-accent" to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
