/**
 * Contract labels (UP set, DOWN/collect filter)
 */
export const STUDENT_APP_LABEL = "student-ide";

/** sanitize để name/volume/routerKey không lỗi */
export function slugify(v) {
  return String(v)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** sanitize cho DNS label */
export function slugifyDns(v) {
  return String(v)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function normalizeSuffix(s) {
  return String(s || "").trim().replace(/\.$/, "").toLowerCase();
}

/** Naming contract */
export function makeStudentContainerName(classId, studentId) {
  return `student-${slugify(classId)}-${slugify(studentId)}`;
}
export function makeStudentVolumeName(classId, studentId) {
  return `ws-${slugify(classId)}-${slugify(studentId)}`;
}
export function makeStudentRouterKey(classId, studentId) {
  return `${slugify(classId)}-${slugify(studentId)}`;
}

/** Meta labels contract */
export function studentMetaLabels(classId, studentId) {
  return {
    app: STUDENT_APP_LABEL,
    classId: String(classId),
    studentId: String(studentId),
  };
}
export function studentVolumeLabels(classId, studentId) {
  return {
    ...studentMetaLabels(classId, studentId),
    volumeType: "workspace",
  };
}
