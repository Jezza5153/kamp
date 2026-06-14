"use server";

import { redirect } from "next/navigation";
import { canEdit, requireUser } from "@/lib/auth";
import { submitOverride } from "@/lib/overrides";

/** Bound in the form as submitEdit.bind(null, businessId). */
export async function submitEdit(businessId: string, formData: FormData) {
  const user = await requireUser();
  if (!(await canEdit(user, businessId))) redirect("/beheer");

  const input: Record<string, string> = {};
  for (const [k, v] of formData.entries()) input[k] = String(v);

  await submitOverride(businessId, user.id, input);
  redirect(`/beheer/${businessId}?saved=1`);
}
