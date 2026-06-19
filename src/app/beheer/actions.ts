"use server";

import { redirect } from "next/navigation";
import { canEdit, requireUser } from "@/lib/auth";
import { submitOverride } from "@/lib/overrides";
import { uploadMedia } from "@/lib/media";
import { createEvent, type EventInput } from "@/lib/events";

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

/** Owner submits an event for their business — lands as pending for admin review. */
export async function submitEventAction(businessId: string, formData: FormData) {
  const user = await requireUser();
  if (!(await canEdit(user, businessId))) redirect("/beheer");

  const input: EventInput = {
    title: String(formData.get("title") ?? ""),
    category: String(formData.get("category") ?? ""),
    whenText: String(formData.get("whenText") ?? ""),
    startDate: String(formData.get("startDate") ?? ""),
    where: String(formData.get("where") ?? ""),
    description: String(formData.get("description") ?? ""),
    url: String(formData.get("url") ?? ""),
    businessId,
  };
  const res = await createEvent(input, "pending", user.id);
  redirect(`/beheer/${businessId}?event=${res.ok ? "ingediend" : "fout"}`);
}
