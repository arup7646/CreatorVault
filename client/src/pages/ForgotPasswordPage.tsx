import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Loader2, ChevronLeft } from 'lucide-react';
import { authApi } from '../api/endpoints';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import toast from 'react-hot-toast';

interface ForgotPasswordForm {
  email: string;
}

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(data.email);
      setSent(true);
      toast.success('If the email exists, a reset link has been sent');
    } catch (error) {
      toast.error('Failed to send reset email');
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
          {sent ? (
            <>
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Check your email</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">We've sent a password reset link to your email address</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot password?</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Enter your email and we'll send you a reset link</p>
            </>
          )}
        </div>

        <Card className="p-6">
          {sent ? (
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={() => setSent(false)} className="gap-2">
                  <Mail className="h-4 w-4" /> Send again
                </Button>
                <Link to="/login">
                  <Button variant="ghost">Back to login</Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
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

              <Button type="submit" className="w-full" isLoading={isLoading}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send Reset Link'}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400">
              ← Back to login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}