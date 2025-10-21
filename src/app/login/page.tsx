"use client";
import { LoginForm } from '@/features/auth/LoginForm';

export default function LoginPage() {
  return (
    <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
      <LoginForm />
    </div>
  );
}
