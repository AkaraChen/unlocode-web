import { toast } from "sonner";

export async function copyWithToast(value: string, label: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    toast.error("复制失败，请手动复制", { description: value });
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label}已复制`, { description: value });
  } catch {
    toast.error("复制失败，请手动复制", { description: value });
  }
}
