(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/apps/web/lib/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "authService",
    ()=>authService
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$5_$40$babel$2b$core$40$7$2e$29$2e$0_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.5_@babel+core@7.29.0_babel-plugin-react-compiler@1.0.0_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
const API_URL = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$5_$40$babel$2b$core$40$7$2e$29$2e$0_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_HTTP_URL || "http://localhost:8080";
class ApiError extends Error {
    status;
    constructor(message, status){
        super(message);
        this.status = status;
    }
}
async function fetcher(endpoint, options = {}) {
    const token = ("TURBOPACK compile-time truthy", 1) ? localStorage.getItem("token") : "TURBOPACK unreachable";
    const headers = new Headers(options.headers || {});
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }
    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }
    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });
    const data = await res.json().catch(()=>null);
    if (!res.ok) {
        throw new ApiError(data?.message || "An error occurred", res.status);
    }
    return data;
}
const authService = {
    signup: async (data)=>{
        return fetcher("/api/auth/signup", {
            method: "POST",
            body: JSON.stringify(data)
        });
    },
    signin: async (data)=>{
        return fetcher("/api/auth/signin", {
            method: "POST",
            body: JSON.stringify(data)
        });
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=apps_web_lib_api_ts_97696b58._.js.map