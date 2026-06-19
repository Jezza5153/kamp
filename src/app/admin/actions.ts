"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requestMagicLink } from "@/lib/auth";
import { moderateOverride } from "@/lib/overrides";
import { approveMedia, rejectMedia } from "@/lib/media";
import { purgeBusiness } from "@/lib/gdpr";
import { saveSettings, getConfiguredSiteUrl } from "@/lib/settings";
import { createIssue, sendIssueBatch } from "@/lib/newsletter";
import { inviteOwner } from "@/lib/invites";
import { setLeadStatus } from "@/lib/leads";
import { setPlaceId, createReviewRequest } from "@/lib/reviews";
import { createEvent, moderateEvent, deleteEvent, type EventInput } from "@/lib/events";
import { createStory, setStoryStatus, deleteStory, type StoryInput } from "@/lib/stories";

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

/** Mint a review-request token for a counter QR card (the funnel's entry point). */
export async function createReviewRequestAction(formData: FormData) {
  await requireAdmin();
  const businessId = String(formData.get("businessId") ?? "");
  const token = await createReviewRequest(businessId);
  redirect(`/admin/google?reviewBiz=${encodeURIComponent(businessId)}${token ? `&reviewToken=${token}` : ""}`);
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

/** Create an editorial story (draft, or published if the box is ticked). */
export async function createStoryAction(formData: FormData) {
  const admin = await requireAdmin();
  const input: StoryInput = {
    slug: String(formData.get("slug") ?? ""),
    title: String(formData.get("title") ?? ""),
    dek: String(formData.get("dek") ?? ""),
    body: String(formData.get("body") ?? ""),
    heroUrl: String(formData.get("heroUrl") ?? ""),
    author: String(formData.get("author") ?? ""),
    businessIds: String(formData.get("businessIds") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
  const status = formData.get("publish") ? "published" : "draft";
  const res = await createStory(input, status, admin.id);
  revalidatePath("/verhalen");
  redirect(`/admin/verhalen?${res.ok ? "added=1" : "error=1"}`);
}

export async function setStoryStatusAction(formData: FormData) {
  const admin = await requireAdmin();
  const raw = String(formData.get("status") ?? "draft");
  const status: "published" | "draft" | "archived" =
    raw === "published" ? "published" : raw === "archived" ? "archived" : "draft";
  await setStoryStatus(String(formData.get("storyId") ?? ""), status, admin.id);
  revalidatePath("/verhalen");
  revalidatePath("/admin/verhalen");
}

export async function deleteStoryAction(formData: FormData) {
  const admin = await requireAdmin();
  await deleteStory(String(formData.get("storyId") ?? ""), admin.id);
  revalidatePath("/verhalen");
  revalidatePath("/admin/verhalen");
}

/** Draft a newsletter issue. */
export async function createIssueAction(formData: FormData) {
  const admin = await requireAdmin();
  await createIssue(String(formData.get("subject") ?? ""), String(formData.get("body") ?? ""), admin.id);
  redirect("/admin/nieuwsbrief");
}

/** Send one resumable batch of an issue to confirmed subscribers. */
export async function sendIssueBatchAction(formData: FormData) {
  await requireAdmin();
  const issueId = String(formData.get("issueId") ?? "");
  const base = (await getConfiguredSiteUrl())?.replace(/\/$/, "") ?? "https://ondernemersvandekamp.nl";
  const res = await sendIssueBatch(issueId, base, 100);
  redirect(`/admin/nieuwsbrief?sent=${res.sent}&remaining=${res.remaining}`);
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
