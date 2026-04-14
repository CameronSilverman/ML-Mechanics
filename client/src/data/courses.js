/**
 * courses.js — ML Maker Studio course registry
 *
 * To add a course: push a new object to COURSES. No other file needs changes.
 *
 * Course shape:
 * {
 *   id:          string
 *   title:       string
 *   description: string        — shown on the course card
 *   lessonIds:   string[]      — ordered; the same lesson may appear in multiple courses
 * }
 */
export const COURSES = [
    {
      id: "ml-foundations",
      title: "ML Foundations",
      description:
        "Start from zero. This course walks you through the core building blocks " +
        "of neural networks — inputs, dense layers, activations, and training — " +
        "using hands-on pipeline exercises.",
      lessonIds: ["dense-intro"],
    },
  ];
  
  export const getCourseById = (id) => COURSES.find((c) => c.id === id) || null;