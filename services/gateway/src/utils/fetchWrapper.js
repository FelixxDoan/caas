export default async function fetchWrapper(url, options) {
  const res = await fetch(url, options).catch(err => {
    console.error("Upstream fetch error:", err);
    throw new Error("Bad upstream");
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Upstream non-OK:", res.status, text);
    // tuỳ bạn: có thể ném lỗi giữ nguyên mã, hoặc map 5xx -> 502
    throw new Error(`Upstream ${res.status}`);
  }
  return res.json();
}

 export function withTimeout(ms = 10000) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), ms);
  return { signal: ac.signal, clear: () => clearTimeout(timer) };
}