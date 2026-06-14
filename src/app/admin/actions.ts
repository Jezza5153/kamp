"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { moderateOverride } from "@/lib/overrides";
import { approveMedia, rejectMedia } from "@/lib/media";

export async function approve(id: string) {
  const admin = await requireAdmin();
  await moderateOverride(id, "approved", admin.id);
  revalidatePath("/admin");
}

export async function reject(id: string, formData: FormData) {
  const admin = await requireAdmin();
  await moderateOverride(id, "rejected", admin.id, String(formData.get("reason") ?? ""));
  revalidatePath("/admin");
}

export async function approvePhoto(mediaId: string) {
  const admin = await requireAdmin();
  await approveMedia(mediaId, admin.id);
  revalidatePath("/admin");
}

export async function rejectPhoto(mediaId: string) {
  const admin = await requireAdmin();
  await rejectMedia(mediaId, admin.id);
  revalidatePath("/admin");
}
