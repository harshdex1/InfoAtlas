import { getAccessToken } from "./googleAuth";
import { GmailMessageSummary, GmailUserProfile, GmailLabel } from "../types";

const GMAIL_BASE_URL = "https://gmail.googleapis.com/gmail/v1/users/me";

// Base64URL decoder helper
export function decodeBase64Url(input: string): string {
  try {
    let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (err) {
    console.warn("Base64Url decode failed, using fallback:", err);
    try {
      return atob(input.replace(/-/g, "+").replace(/_/g, "/"));
    } catch {
      return input;
    }
  }
}

// Base64URL encoder helper for RFC 2822 email creation
export function encodeBase64Url(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Fetch authenticated Gmail user profile
export async function fetchGmailProfile(): Promise<GmailUserProfile | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const res = await fetch(`${GMAIL_BASE_URL}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to load Gmail profile: ${res.statusText}`);
  }

  return await res.json();
}

// Fetch Gmail labels (Inbox, Starred, Sent, Drafts, Trash, etc.)
export async function fetchGmailLabels(): Promise<GmailLabel[]> {
  const token = await getAccessToken();
  if (!token) return [];

  const res = await fetch(`${GMAIL_BASE_URL}/labels`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to load Gmail labels: ${res.statusText}`);
  }

  const data = await res.json();
  return data.labels || [];
}

// List messages with rich summary metadata
export async function listGmailMessages(options?: {
  q?: string;
  labelIds?: string[];
  maxResults?: number;
  pageToken?: string;
}): Promise<{ messages: GmailMessageSummary[]; nextPageToken?: string; resultSizeEstimate?: number }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Google access token missing. Please sign in with Google.");
  }

  const params = new URLSearchParams();
  if (options?.q) params.append("q", options.q);
  if (options?.maxResults) params.append("maxResults", String(options.maxResults));
  else params.append("maxResults", "20");
  if (options?.pageToken) params.append("pageToken", options.pageToken);
  if (options?.labelIds && options.labelIds.length > 0) {
    options.labelIds.forEach((lbl) => params.append("labelIds", lbl));
  }

  const listRes = await fetch(`${GMAIL_BASE_URL}/messages?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!listRes.ok) {
    const errData = await listRes.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to fetch messages: ${listRes.statusText}`);
  }

  const listData = await listRes.json();
  const rawList: { id: string; threadId: string }[] = listData.messages || [];

  if (rawList.length === 0) {
    return { messages: [], nextPageToken: undefined, resultSizeEstimate: 0 };
  }

  // Fetch metadata for up to 20 messages in parallel
  const detailPromises = rawList.slice(0, 20).map(async (item) => {
    try {
      const msgRes = await fetch(
        `${GMAIL_BASE_URL}/messages/${item.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!msgRes.ok) return null;
      const msgData = await msgRes.json();

      const headers = msgData.payload?.headers || [];
      const getH = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

      const rawFrom = getH("From");
      let fromName = rawFrom;
      let fromEmail = rawFrom;
      const match = rawFrom.match(/^(.*?)\s*<(.+?)>$/);
      if (match) {
        fromName = match[1].replace(/["']/g, "").trim() || match[2];
        fromEmail = match[2].trim();
      }

      const labels = msgData.labelIds || [];
      const isUnread = labels.includes("UNREAD");
      const isStarred = labels.includes("STARRED");

      return {
        id: msgData.id,
        threadId: msgData.threadId,
        snippet: msgData.snippet || "",
        historyId: msgData.historyId,
        internalDate: msgData.internalDate,
        from: fromEmail,
        fromName: fromName || fromEmail,
        to: getH("To"),
        subject: getH("Subject") || "(No Subject)",
        date: getH("Date"),
        isUnread,
        isStarred,
        labelIds: labels,
      } as GmailMessageSummary;
    } catch {
      return null;
    }
  });

  const detailed = (await Promise.all(detailPromises)).filter(Boolean) as GmailMessageSummary[];

  return {
    messages: detailed,
    nextPageToken: listData.nextPageToken,
    resultSizeEstimate: listData.resultSizeEstimate,
  };
}

// Helper to extract body from MIME parts recursively
function extractBodyFromPayload(payload: any): { html: string; text: string } {
  let html = "";
  let text = "";

  if (!payload) return { html, text };

  if (payload.body && payload.body.data) {
    const decoded = decodeBase64Url(payload.body.data);
    if (payload.mimeType === "text/html") {
      html += decoded;
    } else {
      text += decoded;
    }
  }

  if (payload.parts && Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      const nested = extractBodyFromPayload(part);
      if (nested.html) html += nested.html;
      if (nested.text) text += nested.text;
    }
  }

  return { html, text };
}

// Get full message detail including decoded body
export async function getGmailMessageDetail(messageId: string): Promise<GmailMessageSummary> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Access token missing. Please sign in with Google.");
  }

  const res = await fetch(`${GMAIL_BASE_URL}/messages/${messageId}?format=full`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to load message detail: ${res.statusText}`);
  }

  const msgData = await res.json();
  const headers = msgData.payload?.headers || [];
  const getH = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

  const rawFrom = getH("From");
  let fromName = rawFrom;
  let fromEmail = rawFrom;
  const match = rawFrom.match(/^(.*?)\s*<(.+?)>$/);
  if (match) {
    fromName = match[1].replace(/["']/g, "").trim() || match[2];
    fromEmail = match[2].trim();
  }

  const labels = msgData.labelIds || [];
  const { html, text } = extractBodyFromPayload(msgData.payload);

  return {
    id: msgData.id,
    threadId: msgData.threadId,
    snippet: msgData.snippet || "",
    historyId: msgData.historyId,
    internalDate: msgData.internalDate,
    from: fromEmail,
    fromName: fromName || fromEmail,
    to: getH("To"),
    subject: getH("Subject") || "(No Subject)",
    date: getH("Date"),
    isUnread: labels.includes("UNREAD"),
    isStarred: labels.includes("STARRED"),
    labelIds: labels,
    bodyHtml: html || (text ? `<p style="white-space: pre-wrap; font-family: sans-serif;">${text}</p>` : ""),
    bodyText: text || msgData.snippet,
  };
}

// Send an RFC 2822 email message
export async function sendGmailMessage(options: {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  inReplyTo?: string;
  threadId?: string;
}): Promise<{ id: string; threadId: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Access token missing. Please sign in with Google.");
  }

  const rfcLines: string[] = [
    `To: ${options.to}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(options.subject)))}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=utf-8",
  ];

  if (options.cc) {
    rfcLines.push(`Cc: ${options.cc}`);
  }
  if (options.inReplyTo) {
    rfcLines.push(`In-Reply-To: ${options.inReplyTo}`);
    rfcLines.push(`References: ${options.inReplyTo}`);
  }

  // Format body with paragraph breaks if raw plain text
  const formattedBody = options.body.includes("<")
    ? options.body
    : options.body
        .split("\n\n")
        .map((p) => `<p style="margin: 0 0 12px 0; font-family: sans-serif; line-height: 1.5;">${p.replace(/\n/g, "<br>")}</p>`)
        .join("");

  rfcLines.push("", formattedBody);

  const rawRfc = rfcLines.join("\r\n");
  const rawBase64 = encodeBase64Url(rawRfc);

  const payload: any = { raw: rawBase64 };
  if (options.threadId) {
    payload.threadId = options.threadId;
  }

  const res = await fetch(`${GMAIL_BASE_URL}/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to send email: ${res.statusText}`);
  }

  return await res.json();
}

// Move message to trash
export async function trashGmailMessage(messageId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error("Access token missing.");

  const res = await fetch(`${GMAIL_BASE_URL}/messages/${messageId}/trash`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to trash message: ${res.statusText}`);
  }
}

// Modify message labels (e.g., mark as read/unread, star/unstar)
export async function modifyGmailMessageLabels(
  messageId: string,
  addLabelIds: string[] = [],
  removeLabelIds: string[] = []
): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error("Access token missing.");

  const res = await fetch(`${GMAIL_BASE_URL}/messages/${messageId}/modify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ addLabelIds, removeLabelIds }),
  });

  if (!res.ok) {
    throw new Error(`Failed to modify message labels: ${res.statusText}`);
  }
}
