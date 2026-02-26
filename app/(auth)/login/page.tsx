'use client'

import { ChangeEvent, SubmitEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client';
import { LoaderCircle, Lock, Mail } from 'lucide-react'
import '@/app/globals.css'

function Signup() {
    const supabase = createClient()
    const [user, setUser] = useState({ email: '', password: '' })
    const [errors, setErrors] = useState({ email: '', password: '' })
    const [loading, setLoading] = useState(false)

    const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = e.target
        setUser({ ...user, [name]: value })
        setErrors({ ...errors, [name]: '' })
    }

    const handleSubmit = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault()

        const newErrors = { email: '', password: '' }

        if (!user.email.trim()) newErrors.email = 'Please enter a valid email.'
        if (!user.password.trim()) newErrors.password = 'Password cannot be empty.'

        if (newErrors.email || newErrors.password) {
            setErrors(newErrors)
            return
        }

        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: user.password,
        })
        if (error) console.log(error)
        else window.location.href = '/dashboard'
        setUser({  email: '', password: '' })
        setLoading(false)
    }

    return (
        <div className="flex min-h-screen items-center justify-center auth-card">
            <div className="w-full max-w-md rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-[hsl(var(--card-foreground))] shadow-[var(--shadow)]">
                <h2 className="mb-8 text-center text-2xl font-semibold text-[hsl(var(--foreground))]">
                    Login to Nook
                </h2>

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[hsl(var(--muted-foreground))]">
                            Email
                        </label>
                        <div className="relative flex items-center">
                            <span className="absolute left-3 text-[hsl(var(--muted-foreground))]">
                                <Mail size={20} />
                            </span>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                value={user.email}
                                onChange={handleChange}
                                className={`w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-4 py-2.5 pl-10 text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/0.35)] ${errors.email ? 'border-[hsl(var(--destructive))] ring-2 ring-[hsl(var(--destructive)/0.25)]' : ''
                                    }`}
                            />
                        </div>
                        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                    </div>

                    {/* Password */}
                    <div className="mb-6">
                        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[hsl(var(--muted-foreground))]">
                            Password
                        </label>
                        <div className="relative flex items-center">
                            <span className="absolute left-3 text-[hsl(var(--muted-foreground))]">
                                <Lock size={20} />
                            </span>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                placeholder="Enter your password"
                                value={user.password}
                                onChange={handleChange}
                                className={`w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-4 py-2.5 pl-10 text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/0.35)] ${errors.password ? 'border-[hsl(var(--destructive))] ring-2 ring-[hsl(var(--destructive)/0.25)]' : ''
                                    }`}
                            />
                        </div>
                        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex h-10 w-full items-center justify-center rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] transition hover:bg-[hsl(var(--primary)/0.92)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? <LoaderCircle className="animate-spin" size={20} /> : 'Login'}
                    </button>
                </form>

                {/* Login Link */}
                <div className="mt-4 text-center">
                    <span className="text-sm text-[hsl(var(--muted-foreground))]">Don&apos;t have an account? </span>
                    <a href="/signup" className="text-sm font-medium text-[hsl(var(--primary))] hover:underline">
                        Sign Up
                    </a>
                </div>
            </div>
        </div>
    )
}

export default Signup