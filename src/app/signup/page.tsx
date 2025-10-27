"use client";
import React from 'react';
import SignUpForm from '@/features/auth/SignUpForm';

export default function SignupPage() {
    return (
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh'}}>
            <SignUpForm/>
        </div>
    );
}
