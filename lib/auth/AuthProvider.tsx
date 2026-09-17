"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { AppUser } from "@/lib/types";

interface AuthContextValue {
  loading: boolean;
  profile: AppUser | null;
  isAdmin: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  loading: true,
  profile: null,
  isAdmin: false,
  refresh: async () => {},
  signOut: async () => {},
});

function rowToProfile(row: any): AppUser {
  return {
    id: row.id,
    kakaoId: row.kakao_id,
    name: row.name,
    avatarUrl: row.avatar_url,
    birthDate: row.birth_date,
    createdAt: row.created_at,
    consent: {
      termsAgreedAt: row.terms_agreed_at,
      privacyRequiredAgreedAt: row.privacy_required_agreed_at,
      privacyOptionalAgreedAt: row.privacy_optional_agreed_at,
    },
    status: row.status,
    role: row.role,
  };
}

/**
 * 로그인 상태(현재 유저 프로필)를 앱 전체에 제공합니다. 햄버거 네비게이션의
 * 프로필사진/닉네임/관리자 버튼 노출 여부가 전부 여기서 나옵니다.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    setProfile(data ? rowToProfile(data) : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      load();
    });
    return () => subscription.unsubscribe();
  }, [load]);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ loading, profile, isAdmin: profile?.role === "admin", refresh: load, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
