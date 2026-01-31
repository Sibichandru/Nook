'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client'


type AuthContextType = {
    user: User | null;
    authLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    authLoading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const supabase = createClient();
    const [user, setUser] = useState<any | null>(null)
    const [authLoading, setAuthLoading] = useState(true)

    useEffect(() => {
        let isComponentMounted = true;
        supabase.auth.getUser().then(({ data }) => {
            if (isComponentMounted) {
                setUser(data.user ?? null);
                setAuthLoading(false);
            }
        });
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (isComponentMounted) {
                setUser(session?.user ?? null);
            }
        });

        return () => {
            isComponentMounted = false
            authListener.subscription.unsubscribe();
        }
    }, [])


    return (
        <AuthContext.Provider value={{ user: user, authLoading: authLoading }}>
            {children}
        </AuthContext.Provider>
    )
}
export const useAuth = () => useContext(AuthContext); 