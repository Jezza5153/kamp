"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requestMagicLink } from "@/lib/auth";
import { moderateOverride } from "@/lib/overrides";
import { approveMedia, rejectMedia } from "@/lib/media";
import { purgeBusiness } from "@/lib/gdpr";
import { saveSettings } from "@/lib/settings";
import { inviteOwner } from "@/lib/invites";
import { setLeadStatus } from "@/lib/leads";
import { setPlaceId } from "@/lib/reviews";
import { createEvent, moderateEvent, deleteEvent, type EventInput } from "@/lib/events";

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

/** GDPR erase: requires typing WIS to confirm (guards against a stray click). */
export async function purgeBusinessData(formData: FormData) {
  await requireAdmin();
  const businessId = String(formData.get("businessId") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (!businessId || confirm.trim().toUpperCase() !== "WIS") return;
  await purgeBusiness(businessId);
  revalidatePath("/admin");
}

/** Link an email to a business and email them a login link. Ownership binds when
 *  they log in (claimInvitesForEmail), so the magic link proves the address. */
export async function inviteOwnerAction(formData: FormData) {
  const admin = await requireAdmin();
  const email = String(formData.get("email") ?? "");
  const businessId = String(formData.get("businessId") ?? "");
  const res = await inviteOwner(email, businessId, admin.id);
  // skipThrottle: an admin invite must not be silently dropped by the shared
  // anonymous-login rate-limit bucket (it's the owner's only way in).
  if (res.ok) await requestMagicLink(email, { skipThrottle: true });
  revalidatePath("/admin");
}

/** Link a business to its Google place_id (powers the review-acquisition link). */
export async function setPlaceIdAction(formData: FormData) {
  const admin = await requireAdmin();
  await setPlaceId(String(formData.get("businessId") ?? ""), String(formData.get("placeId") ?? ""), admin.id);
  revalidatePath("/admin");
}

export async function approveLeadAction(formData: FormData) {
  const admin = await requireAdmin();
  await setLeadStatus(String(formData.get("leadId") ?? ""), "approved", admin.id);
  revalidatePath("/admin");
}

export async function rejectLeadAction(formData: FormData) {
  const admin = await requireAdmin();
  await setLeadStatus(String(formData.get("leadId") ?? ""), "rejected", admin.id);
  revalidatePath("/admin");
}

/** Admin adds an event straight to the agenda (created already-approved). */
export async function addEventAction(formData: FormData) {
  const admin = await requireAdmin();
  const input: EventInput = {
    title: String(formData.get("title") ?? ""),
    category: String(formData.get("category") ?? ""),
    recurring: String(formData.get("recurring") ?? ""),
    whenText: String(formData.get("whenText") ?? ""),
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
    where: String(formData.get("where") ?? ""),
    description: String(formData.get("description") ?? ""),
    url: String(formData.get("url") ?? ""),
  };
  const res = await createEvent(input, "approved", admin.id);
  revalidatePath("/agenda");
  redirect(`/admin/agenda?${res.ok ? "added=1" : "error=1"}`);
}

export async function approveEventAction(formData: FormData) {
  const admin = await requireAdmin();
  await moderateEvent(String(formData.get("eventId") ?? ""), "approved", admin.id);
  revalidatePath("/agenda");
  revalidatePath("/admin/agenda");
}

export async function rejectEventAction(formData: FormData) {
  const admin = await requireAdmin();
  await moderateEvent(String(formData.get("eventId") ?? ""), "rejected", admin.id);
  revalidatePath("/agenda");
  revalidatePath("/admin/agenda");
}

export async function deleteEventAction(formData: FormData) {
  const admin = await requireAdmin();
  await deleteEvent(String(formData.get("eventId") ?? ""), admin.id);
  revalidatePath("/agenda");
  revalidatePath("/admin/agenda");
}

export async function saveSettingsAction(formData: FormData) {
  await requireAdmin();
  const values: Record<string, string> = {
    resend_from: String(formData.get("resend_from") ?? ""),
    admin_emails: String(formData.get("admin_emails") ?? ""),
    site_url: String(formData.get("site_url") ?? ""),
  };
  // Only change secret-ish keys when a new value is typed (blank = keep current).
  const key = String(formData.get("resend_api_key") ?? "").trim();
  if (key) values.resend_api_key = key;
  const mapsKey = String(formData.get("google_maps_api_key") ?? "").trim();
  if (mapsKey) values.google_maps_api_key = mapsKey;
  await saveSettings(values);
  redirect("/admin/instellingen?saved=1");
}
