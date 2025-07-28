import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "../api/client";
import { login as loginAlumno } from "../features/login/api";
import type { AxiosResponse } from "axios";

interface AuthContextType {
  accessToken: string | null;
  user: { id: number; nombre: string; email: string } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

interface LoginSuccessResponse {
  accessToken: string;
  user: {
    id: number;
    nombre: string;
    email: string;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error("useAuth debe ser usado con un authProvider");
  }

  return authContext;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null | undefined>(
    undefined
  );
  const [user, setUser] = useState<{
    id: number;
    nombre: string;
    email: string;
  } | null>(null);

  const clearAuth = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem("auth_user");
  }, []);

  // Función de logout
  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response: LoginSuccessResponse = await loginAlumno({
          email,
          password,
        });

        console.log("Axios Response completa:", response); // <-- Nuevo log
        console.log("Axios Response data:", response.accessToken);

        if (!response) {
          console.error(
            "Login response or response data is undefined:",
            response
          );
          throw new Error("Respuesta de login inválida del servidor.");
        }

        const receivedAccessToken = response.accessToken;
        const receivedUser = response.user;

        console.log("receivedAccessToken:", receivedAccessToken);
        console.log("receivedUser:", receivedUser);

        if (receivedAccessToken) {
          setAccessToken(receivedAccessToken);
        } else {
          console.warn(
            "Login exitoso, pero el accessToken no fue devuelto en el cuerpo de la respuesta."
          );
        }

        if (receivedUser) {
          setUser(receivedUser);
          localStorage.setItem("auth_user", JSON.stringify(receivedUser));
        }
      } catch (error) {
        console.error("Error durante el login:", error);
        clearAuth();
        throw error;
      }
    },
    [clearAuth]
  );

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem("auth_user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        try {
          const response: AxiosResponse<{ accessToken: string }> =
            await api.post(
              `/api/v1/refresh-token`,
              {},
              {
                withCredentials: true,
              }
            );
          if (!response || !response.data) {
            console.error(
              "Refresh token response or response data is undefined:",
              response
            );
            throw new Error(
              "Respuesta de refresh token inválida del servidor."
            );
          }
          setAccessToken(response.data.accessToken);
          console.log("Access Token obtenido vía refresh al inicio.");
        } catch (refreshErr) {
          console.warn(
            "No se pudo refrescar el token al inicio (quizás no hay refresh token o expiró):",
            refreshErr
          );
          clearAuth();
        }
      } catch (error) {
        console.error("Error al inicializar la autenticación:", error);
        clearAuth();
      }
    };
    initializeAuth();
  }, [clearAuth]);

  useLayoutEffect(() => {
    const authInterceptor = api.interceptors.request.use((config) => {
      const customConfig = config as typeof config & { _retry?: boolean };
      if (!customConfig._retry && accessToken) {
        customConfig.headers.Authorization = `Bearer ${accessToken}`;
      }
      return customConfig;
    });

    return () => {
      api.interceptors.request.eject(authInterceptor);
    };
  }, [accessToken]);

  useLayoutEffect(() => {
    const refreshInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (!originalRequest || !error.response) {
          return Promise.reject(error);
        }

        const isUnauthorized = error.response.status === 401;
        const isAccessTokenExpired =
          error.response.data?.message === "Access Token inválido o expirado";
        const isRefreshTokenEndpoint =
          originalRequest.url &&
          originalRequest.url.includes(`/api/v1/refresh-token`);
        const isRetry = originalRequest._retry;

        if (
          isUnauthorized &&
          isAccessTokenExpired &&
          !isRefreshTokenEndpoint &&
          !isRetry
        ) {
          try {
            console.log("Access Token expirado. Intentando refrescar...");
            const response: AxiosResponse<{ accessToken: string }> =
              await api.post(`/api/v1/refresh-token`, {});

            if (!response || !response.data) {
              console.error(
                "Refresh token reattempt response or response data is undefined:",
                response
              );
              throw new Error(
                "Respuesta de reintento de refresh token inválida del servidor."
              );
            }

            const newAccessToken = response.data.accessToken;
            setAccessToken(newAccessToken);

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            originalRequest._retry = true;
            console.log(
              "Access Token refrescado. Reintentando solicitud original."
            );
            return api(originalRequest);
          } catch (refreshError) {
            console.error(
              "Fallo al refrescar el token. Forzando logout:",
              refreshError
            );
            clearAuth();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(refreshInterceptor);
    };
  }, [clearAuth]);

  const contextValue = {
    accessToken: accessToken ?? null,
    user: user,
    isLoading: accessToken === undefined,
    login,
    logout,
  };

  return (
    <AuthContext.Provider
      value={{
        accessToken: accessToken ?? null,
        user: user
          ? { id: user.id, nombre: user.nombre, email: user.email }
          : null,
        login,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  );
};
