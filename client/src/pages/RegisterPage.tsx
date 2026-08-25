import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import toast from 'react-hot-toast';

interface RegisterForm {
  name: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

const passwordRequirements = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
];

export function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');

  const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm<RegisterForm>({
    defaultValues: { rememberMe: false },
  });

  const watchedPassword = watch('password', '');

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await registerUser({ email: data.email, username: data.username, password: data.password, name: data.name });
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary-600 flex items-center justify-center">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">CreatorVault</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Start organizing your digital assets today</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <Input
              label="Full Name (optional)"
              type="text"
              placeholder="John Doe"
              error={errors.name?.message}
              {...register('name', { maxLength: { value: 100, message: 'Name too long' } })}
              autoComplete="name"
            />

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              autoComplete="email"
            />

            <Input
              label="Username"
              type="text"
              placeholder="johndoe"
              error={errors.username?.message}
              {...register('username', {
                required: 'Username is required',
                minLength: { value: 3, message: 'Username must be at least 3 characters' },
                maxLength: { value: 30, message: 'Username must be at most 30 characters' },
                pattern: {
                  value: /^[a-zA-Z0-9_-]+$/,
                  message: 'Only letters, numbers, underscores, and hyphens allowed',
                },
              })}
              autoComplete="username"
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  validate: {
                    uppercase: v => /[A-Z]/.test(v) || 'Must contain an uppercase letter',
                    lowercase: v => /[a-z]/.test(v) || 'Must contain a lowercase letter',
                    number: v => /[0-9]/.test(v) || 'Must contain a number',
                  },
                })}
                onChange={e => { setPassword(e.target.value); setValue('password', e.target.value); }}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {password && (
              <div className="space-y-1.5 pl-1">
                {passwordRequirements.map((req, index) => {
                  const met = req.test(password);
                  return (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className={cn('h-4 w-4 flex-shrink-0', met ? 'text-green-500' : 'text-gray-300 dark:text-gray-600')} />
                      <span className={cn(met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400')}>
                        {req.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <Input
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: v => v === watchedPassword || 'Passwords do not match',
              })}
              autoComplete="new-password"
            />

            <Button type="submit" className="w-full" isLoading={isLoading}>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}