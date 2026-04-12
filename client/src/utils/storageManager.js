import { getComponentDef } from "../data/mlComponents";

const STORAGE_KEY = "ml-maker-studio-pipeline";

export const stripBlockMeta = (blocks) =>
  blocks.map(({ color, icon, ...rest }) => rest);

export const hydrateBlocks = (blocks) =>
  blocks.map((block) => {
    const def = getComponentDef(block.type);
    return {
      ...block,
      color: def?.color ?? "#3b82f6",
      icon:  def?.icon  ?? "▣",
    };
  });
  export const sanitizeFileName = (name) =>
    (name || "ml_pipeline")
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_\-]/g, "")
      || "ml_pipeline";
    

export const savePipeline = (blocks, connections) => {
  try {
    const data = {
      blocks: stripBlockMeta(blocks),
      connections,
      savedAt: new Date().toISOString(),
    };
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
    return {
      success: true,
      data: { ...data, blocks: hydrateBlocks(data.blocks ?? []) },
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export const exportPipeline = (blocks, connections, trainingSettings = null, name = null) => {
  const data = {
    name: "ML Maker Studio Pipeline",
    version: 2,  // v2 = lean format; color/icon omitted and reconstructed on import
    blocks: stripBlockMeta(blocks),
    connections,
    trainingSettings: trainingSettings ?? undefined,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sanitizeFileName(name)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const getMaxBlockId = (blocks) => {
  let max = 0;
  for (const b of blocks) {
    const num = parseInt(b.id.replace("block-", ""), 10);
    if (!isNaN(num) && num > max) max = num;
  }
  return max;
};