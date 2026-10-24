/**
 * Copy text, or show it in a prompt to copy by hand when the browser blocks the clipboard
 * (Instagram and other in-app browsers often do). Never claims a copy that didn't happen.
 */
export async function copyText(text: string): Promise<"copied" | "manual"> {
  try {
    if (!navigator.clipboard?.writeText) throw new Error("no clipboard");
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    window.prompt("Copy this link:", text);
    return "manual";
  }
}
