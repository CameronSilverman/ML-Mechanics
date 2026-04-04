/**
 * solutionChecker.js
 *
 * Pure functions that compare canvas state against a lesson's solution definition.
 */

// --- Block matching ---

/**
 * Return true if `block` satisfies `requiredBlock`.
 * Property values are compared with loose equality (== ) to handle number/string
 * coercion — e.g. units stored as the number 128 matches the required value 128
 * or "128" equally well.
 *
 * @param {object} block           — canvas block object
 * @param {{ type, requiredProperties }} requiredBlock
 */
const blockSatisfies = (block, requiredBlock) => {
  if (block.type !== requiredBlock.type) return false;
  for (const [key, expected] of Object.entries(
    requiredBlock.requiredProperties || {}
  )) {
    // eslint-disable-next-line eqeqeq
    if (block.properties[key] != expected) return false;
  }
  return true;
};

/**
 * Greedily match each entry in `requiredBlocks` to a distinct canvas block.
 * Returns true only when every required block finds a unique match.
 *
 * @param {object[]} blocks         — current canvas blocks
 * @param {object[]} requiredBlocks — from lesson.solution.requiredBlocks
 */
export const checkRequiredBlocks = (blocks, requiredBlocks) => {
  const used = new Set();
  for (const req of requiredBlocks) {
    const match = blocks.find(
      (b) => !used.has(b.id) && blockSatisfies(b, req)
    );
    if (!match) return false;
    used.add(match.id);
  }
  return true;
};

// --- Connection matching ---

/**
 * Check that at least one connection of each { fromType, toType } pair exists.
 * The check is loose — it does not require a specific ordering between pairs.
 *
 * @param {object[]} blocks
 * @param {object[]} connections
 * @param {Array<{fromType:string, toType:string}>} sequence
 */
export const checkConnectionSequence = (blocks, connections, sequence) => {
  const blockMap = Object.fromEntries(blocks.map((b) => [b.id, b]));
  for (const { fromType, toType } of sequence) {
    const found = connections.some((c) => {
      const from = blockMap[c.fromBlockId];
      const to   = blockMap[c.toBlockId];
      return from?.type === fromType && to?.type === toType;
    });
    if (!found) return false;
  }
  return true;
};

// --- Step validation ---

/**
 * Run every step's validate() function and return an array of results.
 * Results are in the same order as lesson.steps.
 *
 * @param {object}   lesson
 * @param {object[]} blocks
 * @param {object[]} connections
 * @returns {Array<{ id: string, passed: boolean }>}
 */
export const checkSteps = (lesson, blocks, connections) =>
  lesson.steps.map((step) => ({
    id: step.id,
    passed: step.validate(blocks, connections),
  }));

// --- Full solution check ---

/**
 * Run the complete solution check for a lesson.
 * Returns true only when all required blocks and connections are satisfied.
 *
 * @param {object}   lesson
 * @param {object[]} blocks
 * @param {object[]} connections
 */
export const checkSolution = (lesson, blocks, connections) => {
  const { solution } = lesson;
  if (!solution) return false;

  const blocksOk = checkRequiredBlocks(blocks, solution.requiredBlocks || []);
  const connOk = solution.requiredConnectionSequence
    ? checkConnectionSequence(
        blocks,
        connections,
        solution.requiredConnectionSequence
      )
    : true;

  return blocksOk && connOk;
};