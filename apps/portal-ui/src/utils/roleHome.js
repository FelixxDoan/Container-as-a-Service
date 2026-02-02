// src/utils/roleHome.js
export default function homePathOf(role) {
  switch (role) {
    case "teacher": return "/teacher";
    case "student": return "/student";
    default:        return "/"; // fallback
  }
}
