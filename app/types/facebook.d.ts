// app/types/facebook.d.ts
export {};

declare global {
  interface Window {
    FB: {
      init: (config: {
        appId: string;
        cookie?: boolean;
        xfbml?: boolean;
        version: string;
      }) => void;
      login: (callback: (response: any) => void, options?: { scope: string }) => void;
      logout: (callback?: (response: any) => void) => void;
      api: (path: string, method: string, params: any, callback: (response: any) => void) => void;
      getLoginStatus: (callback: (response: any) => void) => void;
      ui: (params: any, callback?: (response: any) => void) => void;
    };
    fbAsyncInit: () => void;
  }
}