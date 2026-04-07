const STORAGE_KEY = "campuscart:chatConversations";

function safeParse(json, fallback) {
  try {
    return JSON.parse(json) || fallback;
  } catch {
    return fallback;
  }
}

export function getStoredConversations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return safeParse(raw, []);
  } catch {
    return [];
  }
}

function writeConversations(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

/**
 * Upsert conversation metadata (UI-only; no API change).
 * key: `${productId}:${otherUserId}`
 */
export function upsertConversationMeta({
  productId,
  otherUserId,
  productTitle,
  peerName,
  roleLabel,
  lastMessage,
}) {
  if (!productId || !otherUserId) return;
  const key = `${String(productId)}:${String(otherUserId)}`;
  const list = getStoredConversations();
  const idx = list.findIndex((c) => c.key === key);
  const prev = idx >= 0 ? list[idx] : {};
  const entry = {
    key,
    productId: String(productId),
    otherUserId: String(otherUserId),
    productTitle: productTitle || prev.productTitle || "Product",
    peerName: peerName || prev.peerName || "",
    roleLabel: roleLabel !== undefined && roleLabel !== null ? roleLabel : prev.roleLabel || "",
    lastMessage: lastMessage != null ? String(lastMessage) : prev.lastMessage || "",
    updatedAt: Date.now(),
  };
  if (idx >= 0) {
    list[idx] = { ...prev, ...entry };
  } else {
    list.unshift(entry);
  }
  list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  writeConversations(list);
  window.dispatchEvent(new Event("chatConversationsUpdated"));
}

export function setLastMessageForConversation(productId, otherUserId, text) {
  upsertConversationMeta({
    productId,
    otherUserId,
    lastMessage: text,
  });
}

export function getUnreadCount(key) {
  try {
    const v = parseInt(localStorage.getItem(`chat:unread:${key}`) || "0", 10);
    return Number.isFinite(v) && v > 0 ? v : 0;
  } catch {
    return 0;
  }
}
