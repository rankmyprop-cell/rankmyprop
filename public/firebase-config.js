const ve = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};
const we = typeof window !== "undefined" && window.__RMP_ENV ? window.__RMP_ENV : {};
const gv = (k, d = "") => String(ve[k] ?? we[k] ?? d);
const host = typeof window !== "undefined" ? String(window.location.hostname || "").toLowerCase() : "";
const authDomain = host === "www.rankmyprop.in"
  ? "www.rankmyprop.in"
  : gv("VITE_FIREBASE_AUTH_DOMAIN", "rank-my-prop.firebaseapp.com");

export const firebaseConfig = {
  apiKey: gv("VITE_FIREBASE_API_KEY", "AIzaSyBACBm1Yr4zf-KVy1ejRPJ1rqKFctEumuA"),
  authDomain,
  projectId: gv("VITE_FIREBASE_PROJECT_ID", "rank-my-prop"),
  storageBucket: gv("VITE_FIREBASE_STORAGE_BUCKET", "rank-my-prop.firebasestorage.app"),
  messagingSenderId: gv("VITE_FIREBASE_MESSAGING_SENDER_ID", "1094966707382"),
  appId: gv("VITE_FIREBASE_APP_ID", "1:1094966707382:web:c4cd641630588d6adc9217"),
  measurementId: gv("VITE_FIREBASE_MEASUREMENT_ID", "G-W3E425827L")
};
