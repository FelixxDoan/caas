export function fetchJson(index) {
  const fileName = index.toString().padStart(2, "0") + ".json";
  return fetch(`../output/${fileName}`).then((res) => {
    if (!res.ok) throw new Error("Failed to load " + fileName);
    return res.json();
  });
}
