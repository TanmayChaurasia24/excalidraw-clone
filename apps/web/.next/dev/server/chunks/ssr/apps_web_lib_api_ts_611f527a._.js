module.exports = [
"[project]/apps/web/lib/api.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "authService",
    ()=>authService
]);
const API_URL = process.env.NEXT_PUBLIC_HTTP_URL || "http://localhost:8080";
class ApiError extends Error {
    status;
    constructor(message, status){
        super(message);
        this.status = status;
    }
}
async function fetcher(endpoint, options = {}) {
    const token = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : null;
    const headers = new Headers(options.headers || {});
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
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
}),
];

//# sourceMappingURL=apps_web_lib_api_ts_611f527a._.js.map