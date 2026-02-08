const STORAGE_KEY = "ml-maker-studio-pipeline";

export const savePipeline = (blocks, connections) => {
  try {
    const data = { blocks, connections, savedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export const loadPipeline = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { success: false, error: "No saved pipeline found" };
    const data = JSON.parse(raw);
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export const exportPipeline = (blocks, connections) => {
  const data = {
    name: "ML Maker Studio Pipeline",
    version: 1,
    blocks,
    connections,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ml-pipeline.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const getMaxBlockId = (blocks) => {
  let max = 0;
  for (const b of blocks) {
    const num = parseInt(b.id.replace("block-", ""), 10);
    if (num > max) max = num;
  }
  return max;
};
