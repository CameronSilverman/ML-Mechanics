/**
 * lessons.js — ML Maker Studio lesson registry
 *
 * LESSONS is assembled automatically from every .js file in ./lessons/.
 * To add a lesson: drop a new file into data/lessons/ — no changes needed here.
 *
 * Each file in data/lessons/ must be a JS module with a default export matching
 * the lesson shape below. Files are sorted alphabetically before assembly, so
 * prefix filenames with a number to control ordering (e.g. 01_dense_intro.js).
 *
 * Lesson shape:
 * {
 *   id:                    string
 *   title:                 string
 *   category:              string          — groups lessons on the Learn home page
 *   difficulty:            'beginner' | 'intermediate' | 'advanced'
 *   estimatedMinutes:      number
 *   description:           string          — shown on the lesson card only
 *   objectives:            string[]        — bullet list shown in the Lesson tab header
 *
 *   lockedTrainingSettings: object | null  — locks TrainingSettingsPanel
 *     { optimizer, learningRate, loss, epochs, batchSize }
 *
 *   initialBlocks: Array<{
 *     type:               string           — must match mlComponents.js type key
 *     x:                  number
 *     y:                  number
 *     overrideProperties: object           — merged over component defaults
 *     lockedProperties:   string[]         — keys that cannot be edited
 *   }>
 *
 *   content: Array<ContentBlock>
 *
 *   ContentBlock types:
 *
 *   { type: "text", body: string }
 *   { type: "heading", level: 2|3, body: string }
 *   { type: "callout", variant: "info"|"tip"|"warning"|"math", title?: string, body: string }
 *   { type: "code", language?: string, body: string }
 *   { type: "image", src: string, alt?: string, caption?: string, scale?: number, background?: string }
 *     scale: 0–1 fraction of container width; omit to use natural image size (capped at 100%).
 *     background: any CSS color string — overrides the default dark fill shown through
 *     transparent/semi-transparent images (e.g. "white" or "rgba(255,255,255,0.9)").
 *   { type: "video", src: string, caption?: string, scale?: number }
 *   { type: "divider" }
 *
 *   steps: Array<{
 *     id:          string
 *     title:       string
 *     description: string
 *     hint:        string | null
 *     validate:    (blocks, connections) => boolean   — must be a JS function, not JSON
 *   }>
 *
 *   solution: {
 *     requiredBlocks: Array<{ type, requiredProperties }>
 *     requiredConnectionSequence: Array<{ fromType, toType }> | null
 *   }
 * }
 */

// Auto-discover all lesson modules in ./lessons/ (webpack / CRA)
const context = require.context("./lessons", false, /\.js$/);

const LESSONS = context
  .keys()
  .sort()
  .map((key) => context(key).default)
  .filter(Boolean);

export default LESSONS;

import { COURSES, getCourseById } from "./courses";
export { COURSES, getCourseById };

export const getLessonById = (id) => LESSONS.find((l) => l.id === id) || null;