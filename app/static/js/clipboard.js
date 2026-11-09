// FR-15, FR-27: copy a class number to the clipboard. The caller shows its own
// confirmation, or says to copy it by hand if this returns false.
export async function copyClassNumber(classNbr) {
  try {
    await navigator.clipboard.writeText(classNbr);
    return true;
  } catch {
    return false;
  }
}
