import React, { useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Badge, Image } from "react-bootstrap";
import { ChatConversation } from "./Chat";
import { AuthContext } from "../context/AuthContext";
import { getStoredConversations, getUnreadCount } from "../utils/chatConversations";
import { resolveChatPeer } from "../utils/resolveChatPeer";
import { getImageUrl } from "../utils/imageUrl";
import "./Messages.css";

const Messages = () => {
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [list, setList] = useState(() => getStoredConversations());
  const [peerByKey, setPeerByKey] = useState({});

  const myId = user?._id || user?.id;

  const productIdFromUrl = searchParams.get("productId");
  const otherUserIdFromUrl = searchParams.get("otherUserId");

  const selectedKey =
    productIdFromUrl && otherUserIdFromUrl ? `${String(productIdFromUrl)}:${String(otherUserIdFromUrl)}` : null;

  useEffect(() => {
    const refresh = () => setList(getStoredConversations());
    window.addEventListener("chatConversationsUpdated", refresh);
    window.addEventListener("chatUnreadUpdated", refresh);
    return () => {
      window.removeEventListener("chatConversationsUpdated", refresh);
      window.removeEventListener("chatUnreadUpdated", refresh);
    };
  }, []);

  useEffect(() => {
    if (!myId || !list.length) return;
    let cancelled = false;
    (async () => {
      const pairs = await Promise.all(
        list.map(async (c) => {
          const r = await resolveChatPeer(c.productId, c.otherUserId, myId);
          return [c.key, r];
        })
      );
      if (cancelled) return;
      const next = {};
      pairs.forEach(([k, r]) => {
        next[k] = r;
      });
      setPeerByKey((prev) => ({ ...prev, ...next }));
    })();
    return () => {
      cancelled = true;
    };
  }, [list, myId]);

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

  useEffect(() => {
    if (!myId || !selectedKey) return;
    let cancelled = false;
    (async () => {
      const [pid, oid] = selectedKey.split(":");
      if (!pid || !oid) return;
      const r = await resolveChatPeer(pid, oid, myId);
      if (!cancelled && (r.name || r.avatar)) {
        setPeerByKey((prev) => {
          if (prev[selectedKey]?.name) return prev;
          return { ...prev, [selectedKey]: r };
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedKey, myId]);

  const selectConversation = (c) => {
    const next = new URLSearchParams();
    next.set("productId", c.productId);
    next.set("otherUserId", c.otherUserId);
    if (c.productTitle) next.set("title", c.productTitle);
    if (c.roleLabel) next.set("role", c.roleLabel);
    setSearchParams(next);
  };

  const peerFor = (c) => {
    const r = peerByKey[c.key];
    const name = r?.name || c.peerName;
    const avatar = r?.avatar || null;
    return {
      name: name && String(name).trim() ? name : null,
      avatar,
    };
  };

  const selectedPeer = selected ? peerFor(selected) : null;

  return (
    <div className="messages-page py-4">
      <div className="messages-shell card border-0 shadow-sm">
        <div className="messages-panels">
          <aside className="messages-sidebar border-end">
            <div className="messages-sidebar-header px-3 py-3 border-bottom">
              <h5 className="mb-0">Messages</h5>
            </div>
            <div className="messages-list">
              {list.length === 0 ? (
                <div className="text-muted small p-3">No conversations yet. Open a chat from a product or order.</div>
              ) : (
                list.map((c) => {
                  const unread = getUnreadCount(c.key);
                  const active = selectedKey === c.key;
                  const { name, avatar } = peerFor(c);
                  const displayName = name || "User";
                  return (
                    <button
                      key={c.key}
                      type="button"
                      className={`messages-thread messages-thread-card ${active ? "active" : ""}`}
                      onClick={() => selectConversation(c)}
                    >
                      <div className="messages-thread-row">
                        {avatar ? (
                          <Image
                            src={getImageUrl(avatar, { placeholderSize: 80 })}
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
