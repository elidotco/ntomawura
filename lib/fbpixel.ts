declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

export function track(event: string, params?: object, eventID?: string) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", event, params, eventID ? { eventID } : undefined);
}

export function trackCustom(event: string, params?: object, eventID?: string) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("trackCustom", event, params, eventID ? { eventID } : undefined);
}
