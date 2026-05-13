import { createContext, useState, useEffect } from "react";

export const LoadingContext = createContext(null);

export function LoadingProvider({ children }) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleLoading = (event) => {
      const isLoading = event?.detail?.loading;
      setLoading(Boolean(isLoading));
    };

    window.addEventListener("globalLoading", handleLoading);
    return () => {
      window.removeEventListener("globalLoading", handleLoading);
    };
  }, []);

  return (
    <LoadingContext.Provider value={{ loading }}>
      {children}
      {loading && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center px-4">
          <div className="rounded-2xl bg-white/95 border border-slate-200 p-6 shadow-2xl w-full max-w-md text-center">
            <div className="mx-auto mb-4 w-12 h-12 border-4 border-cuero border-t-transparent rounded-full animate-spin" />
            <p className="text-lg font-semibold text-cuero">Cargando aplicación...</p>
            <p className="text-sm text-slate-500 mt-2">Un momento mientras procesamos tu solicitud.</p>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}
