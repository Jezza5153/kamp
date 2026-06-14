"use server";

import { redirect } from "next/navigation";
import { canEdit, requireUser } from "@/lib/auth";
import { submitOverride } from "@/lib/overrides";
import { uploadMedia } from "@/lib/media";

/** Bound in the form as submitEdit.bind(null, businessId). */
export async function submitEdit(businessId: string, formData: FormData) {
  const user = await requireUser();
  if (!(await canEdit(user, businessId))) redirect("/beheer");

  const input: Record<string, string> = {};
  for (const [k, v] of formData.entries()) input[k] = String(v);

  await submitOverride(businessId, user.id, input);
  redirect(`/beheer/${businessId}?saved=1`);
}

/** Bound in the form as uploadPhoto.bind(null, businessId). Auth is enforced
 *  here (server actions are directly POST-able), not only by the page guard. */
export async function uploadPhoto(businessId: string, formData: FormData) {
  const user = await requireUser();
  if (!(await canEdit(user, businessId))) redirect("/beheer");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect(`/beheer/${businessId}?photo=missing`);
  }

  const res = await uploadMedia(businessId, file, user.id, "hero");
  redirect(`/beheer/${businessId}?photo=${res.ok ? "pending" : res.error}`);
}
