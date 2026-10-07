import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { api } from "../api/client";
import type { Alumno } from "../api/types";
import * as authApi from "../features/auth/api";

interface AuthContextType {
  user: Alumno | null;
  // true mientras se intenta recuperar la sesion al cargar la pagina
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginGoogle: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: Alumno) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error("useAuth debe ser usado con un AuthProvider");
  }

  return authContext;
};

const ACCESS_TOKEN_EXPIRADO = "Access Token inválido o expirado";

type ConfigConReintento = InternalAxiosRequestConfig & { _retry?: boolean };

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Alumno | null>(null);
  const [cargando, setCargando] = useState(true);

  // El access token vive solo en memoria (no en localStorage) para que un
  // script inyectado no lo pueda robar. Al recargar se pide uno nuevo con la
  // cookie httpOnly del refresh token.
  const accessToken = useRef<string | null>(null);
  const refrescando = useRef<Promise<string | null> | null>(null);

  const limpiarSesion = useCallback(() => {
    accessToken.current = null;
    setUser(null);
  }, []);

  // Un solo refresh a la vez aunque fallen varias peticiones juntas
  const refrescarToken = useCallback(() => {
    if (!refrescando.current) {
      refrescando.current = authApi
        .refresh()
        .then((data) => {
          accessToken.current = data.accessToken;
          setUser(data.user);
          return data.accessToken;
        })
        .catch(() => {
          limpiarSesion();
          return null;
        })
        .finally(() => {
          refrescando.current = null;
        });
    }
    return refrescando.current;
  }, [limpiarSesion]);

  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use((config) => {
      if (accessToken.current) {
        config.headers.Authorization = `Bearer ${accessToken.current}`;
      }
      return config;
    });

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<{ msg?: unknown }>) => {
        const original = error.config as ConfigConReintento | undefined;
        const expirado =
          error.response?.status === 401 &&
          error.response.data?.msg === ACCESS_TOKEN_EXPIRADO;

        if (!original || !expirado || original._retry) {
          return Promise.reject(error);
        }

        original._retry = true;
        const nuevoToken = await refrescarToken();
        if (!nuevoToken) {
          return Promise.reject(error);
        }

        original.headers.Authorization = `Bearer ${nuevoToken}`;
        return api(original);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [refrescarToken]);

  // Al abrir la app se intenta recuperar la sesion con la cookie
  useEffect(() => {
    refrescarToken().finally(() => setCargando(false));
  }, [refrescarToken]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    accessToken.current = data.accessToken;
    setUser(data.user);
  }, []);

  const loginGoogle = useCallback(async (credential: string) => {
    const data = await authApi.loginGoogle(credential);
    accessToken.current = data.accessToken;
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      limpiarSesion();
    }
  }, [limpiarSesion]);

  return (
    <AuthContext.Provider value={{ user, cargando, login, loginGoogle, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
