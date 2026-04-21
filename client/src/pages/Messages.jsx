import React, { useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Badge, Image, Spinner } from "react-bootstrap";
import { ChatConversation } from "./Chat";
import { AuthContext } from "../context/AuthContext";
import { getUnreadCount } from "../utils/chatConversations";
import { getImageUrl } from "../utils/imageUrl";
import api from "../utils/api";
import "./Messages.css";

const Messages = () => {
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [list, setList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const myId = user?._id || user?.id;

  const productIdFromUrl = searchParams.get("productId");
  const otherUserIdFromUrl = searchParams.get("otherUserId");

  const selectedKey =
    productIdFromUrl && otherUserIdFromUrl ? `${String(productIdFromUrl)}:${String(otherUserIdFromUrl)}` : null;

  // Fetch server-verified conversation list
  useEffect(() => {
    if (!myId) return;
    let cancelled = false;

    const fetchConversations = async () => {
      try {
        setLoadingList(true);
        const res = await api.get("/chat/conversations");
        const serverConvos = (res.data?.conversations || []).map((c) => ({
          key: `${c.productId}:${c.otherUserId}`,
          productId: c.productId,
          otherUserId: c.otherUserId,
          productTitle: c.productTitle || "Product",
          peerName: c.peerName || "User",
          peerAvatar: c.peerAvatar || null,
          lastMessage: c.lastMessage || "",
          updatedAt: c.lastAt ? new Date(c.lastAt).getTime() : 0,
        }));
        if (!cancelled) setList(serverConvos);
      } catch (err) {
        console.error("Failed to fetch conversations:", err);
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    };

    fetchConversations();

    // Refresh when chat updates happen
    const refresh = () => fetchConversations();
    window.addEventListener("chatConversationsUpdated", refresh);
    window.addEventListener("chatUnreadUpdated", refresh);

    return () => {
      cancelled = true;
      window.removeEventListener("chatConversationsUpdated", refresh);
      window.removeEventListener("chatUnreadUpdated", refresh);
    };
  }, [myId]);

  const selected = useMemo(() => {
    if (!selectedKey) return null;
    const found = list.find((c) => c.key === selectedKey);
    if (found) return found;
    return {
      key: selectedKey,
      productId: String(productIdFromUrl),
      otherUserId: String(otherUserIdFromUrl),
      productTitle: searchParams.get("title") || "Product",
      roleLabel: searchParams.get("role") || "",
    };
  }, [list, selectedKey, productIdFromUrl, otherUserIdFromUrl, searchParams]);

  const selectConversation = (c) => {
    const next = new URLSearchParams();
    next.set("productId", c.productId);
    next.set("otherUserId", c.otherUserId);
    if (c.productTitle) next.set("title", c.productTitle);
    if (c.roleLabel) next.set("role", c.roleLabel);
    setSearchParams(next);
  };

  const selectedPeer = selected
    ? { name: selected.peerName || null, avatar: selected.peerAvatar || null }
    : null;

  return (
    <div className="messages-page py-4">
      <div className="messages-shell card border-0 shadow-sm">
        <div className={`messages-panels${selected ? " has-chat" : ""}`}>
          <aside className="messages-sidebar border-end">
            <div className="messages-sidebar-header px-3 py-3 border-bottom">
              <h5 className="mb-0">Messages</h5>
            </div>
            <div className="messages-list">
              {loadingList ? (
                <div className="text-center p-4">
                  <Spinner animation="border" size="sm" />
                </div>
              ) : list.length === 0 ? (
                <div className="text-muted small p-3">No conversations yet. Open a chat from a product or order.</div>
              ) : (
                list.map((c) => {
                  const unread = getUnreadCount(c.key);
                  const active = selectedKey === c.key;
                  const displayName = c.peerName || "User";
                  return (
                    <button
                      key={c.key}
                      type="button"
                      className={`messages-thread messages-thread-card ${active ? "active" : ""}`}
                      onClick={() => selectConversation(c)}
                    >
                      <div className="messages-thread-row">
                        {c.peerAvatar ? (
                          <Image
                            src={getImageUrl(c.peerAvatar, { placeholderSize: 80 })}
                            roundedCircle
                            className="messages-thread-avatar"
                            alt=""
                          />
                        ) : (
                          <div className="messages-thread-avatar-placeholder" aria-hidden>
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="messages-thread-text">
                          <div className="messages-thread-name-row">
                            <span className="messages-thread-name text-truncate">{displayName}</span>
                            {unread > 0 ? (
                              <Badge bg="danger" pill className="messages-unread-badge">
                                {unread}
                              </Badge>
                            ) : null}
                          </div>
                          <div className="messages-thread-product text-truncate">{c.productTitle || "Product"}</div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="messages-main">
            {selected ? (
              <div className="messages-chat-wrap p-3 h-100">
                <ChatConversation
                  embedded
                  showOuterBack={false}
                  productId={selected.productId}
                  otherUserId={selected.otherUserId}
                  title={selected.productTitle || "Chat"}
                  roleLabel={selected.roleLabel || undefined}
                  peerDisplayName={selectedPeer?.name ?? undefined}
                  peerAvatar={selectedPeer?.avatar ?? undefined}
                />
              </div>
            ) : (
              <div className="messages-empty d-flex align-items-center justify-content-center h-100 text-muted p-4">
                Select a conversation
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Messages;
