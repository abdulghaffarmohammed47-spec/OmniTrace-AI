import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'analyst' | 'admin' | 'viewer';
  avatar: string;
  createdAt: number;
  lastLogin: number;
}

interface StoredUser extends User {
  password: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string, role: User['role']) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<Pick<User, 'name' | 'role'>>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USERS_KEY = 'omnitrace_users';
const SESSION_KEY = 'omnitrace_session';

function getStoredUsers(): StoredUser[] {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function saveSession(userId: string | null) {
  if (userId) {
    localStorage.setItem(SESSION_KEY, userId);
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

// Simple hash for demo (not for production — just so passwords aren't stored in plaintext in localStorage)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'h_' + Math.abs(hash).toString(36);
}

function generateId(): string {
  return 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

const AVATAR_COLORS = [
  'from-cyan-500 to-blue-600',
  'from-purple-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-red-600',
  'from-indigo-500 to-violet-600',
];

function getAvatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// Seed a demo admin account on first load
function ensureDemoAccount() {
  const users = getStoredUsers();
  if (users.length === 0) {
    const demoUser: StoredUser = {
      id: 'usr_demo_admin',
      email: 'admin@omnitrace.ai',
      name: 'Alex Morgan',
      role: 'admin',
      avatar: getAvatarGradient('Alex Morgan'),
      password: simpleHash('admin123'),
      createdAt: Date.now() - 86400000 * 30,
      lastLogin: Date.now(),
    };
    saveStoredUsers([demoUser]);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Boot: restore session
  useEffect(() => {
    ensureDemoAccount();
    const sessionId = getSession();
    if (sessionId) {
      const users = getStoredUsers();
      const found = users.find(u => u.id === sessionId);
      if (found) {
        const { password: _, ...safeUser } = found;
        setUser(safeUser);
      }
    }
    // Brief loading delay for a nice UX transition
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));

    const users = getStoredUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!found) {
      return { success: false, error: 'No account found with that email address.' };
    }

    if (found.password !== simpleHash(password)) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    // Update last login
    found.lastLogin = Date.now();
    saveStoredUsers(users);
    saveSession(found.id);

    const { password: _, ...safeUser } = found;
    setUser(safeUser);
    return { success: true };
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string, role: User['role']): Promise<{ success: boolean; error?: string }> => {
    await new Promise(r => setTimeout(r, 800));

    const users = getStoredUsers();

    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'An account with that email already exists.' };
    }

    const newUser: StoredUser = {
      id: generateId(),
      email: email.toLowerCase(),
      name,
      role,
      avatar: getAvatarGradient(name),
      password: simpleHash(password),
      createdAt: Date.now(),
      lastLogin: Date.now(),
    };

    users.push(newUser);
    saveStoredUsers(users);
    saveSession(newUser.id);

    const { password: _, ...safeUser } = newUser;
    setUser(safeUser);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    saveSession(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback((updates: Partial<Pick<User, 'name' | 'role'>>) => {
    if (!user) return;
    const users = getStoredUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      if (updates.name) users[idx].name = updates.name;
      if (updates.role) users[idx].role = updates.role;
      saveStoredUsers(users);
      setUser(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
