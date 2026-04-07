import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Container, Card, Form, Button, Spinner, Alert, Image } from "react-bootstrap";
import api from "../utils/api";
import { AuthContext } from "../context/AuthContext";
import { createSocket } from "../utils/socket";
import { upsertConversationMeta, setLastMessageForConversation } from "../utils/chatConversations";
import { resolveChatPeer } from "../utils/resolveChatPeer";
import { getImageUrl } from "../utils/imageUrl";
import "./Chat.css";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

/**
 * Shared chat UI — used by /chat route and embedded Messages panel.
 * Props override query string when provided.
 */
export function ChatConversation({
  productId: propProductId,
  otherUserId: propOtherUserId,
  title: propTitle,
  roleLabel: roleLabelProp,
  peerDisplayName: peerDisplayNameProp,
  peerAvatar: peerAvatarProp,
  embedded = false,
  showOuterBack = true,
  onBack,
}) {
  const query = useQuery();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);

  const productId = propProductId ?? query.get("productId");
  const otherUserId = propOtherUserId ?? query.get("otherUserId");
  const productTitle = (propTitle ?? query.get("title")) || "Chat";
  const roleLabel = roleLabelProp ?? query.get("role") ?? "";

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [resolvedPeer, setResolvedPeer] = useState({ name: null, avatar: null });

  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  const myId = user?._id || user?.id;
  const conversationKey = productId && otherUserId ? `${String(productId)}:${String(otherUserId)}` : null;

  const peerName =
    peerDisplayNameProp ||
    resolvedPeer.name ||
    null;
  const peerAvatar = peerAvatarProp ?? resolvedPeer.avatar ?? null;

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const syncMeta = (lastMsg) => {
    if (!productId || !otherUserId) return;
    upsertConversationMeta({
      productId,
      otherUserId,
      productTitle,
      peerName: peerName || undefined,
      roleLabel: roleLabel || undefined,
      lastMessage: lastMsg != null ? String(lastMsg) : "",
    });
  };

  useEffect(() => {
    if (peerDisplayNameProp) {
      setResolvedPeer({ name: peerDisplayNameProp, avatar: peerAvatarProp || null });
      return;
    }
    if (!productId || !otherUserId || !myId) return;
    let cancelled = false;
    (async () => {
      const r = await resolveChatPeer(productId, otherUserId, myId);
      if (!cancelled) setResolvedPeer(r);
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, otherUserId, myId, peerDisplayNameProp, peerAvatarProp]);

  useEffect(() => {
    if (!productId || !otherUserId || !peerName) return;
    upsertConversationMeta({
      productId,
      otherUserId,
      productTitle,
      peerName,
      roleLabel: roleLabel || undefined,
    });
  }, [peerName, productId, otherUserId, productTitle, roleLabel]);

  useEffect(() => {
    if (!isAuthenticated) {
      if (!embedded) navigate("/login", { replace: true });
      return;
    }
    if (!productId || !otherUserId) {
      setError("Missing chat details.");
      setLoading(false);
      return;
    }

    try {
      if (conversationKey) {
        localStorage.setItem("chat:activeKey", conversationKey);
        localStorage.setItem(`chat:unread:${conversationKey}`, "0");
        window.dispatchEvent(new Event("chatUnreadUpdated"));
      }
    } catch (_) {
      // ignore
    }

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/chat/history/${productId}?otherUserId=${otherUserId}`);
        const list = res.data?.messages || [];
        setMessages(list);
        const last = list.length ? list[list.length - 1]?.message : "";
        syncMeta(last);
      } catch (err) {
        const msg = err.response?.data?.msg || err.response?.data?.message || "Failed to load chat history";
        setError(msg);
      } finally {
        setLoading(false);
        setTimeout(scrollToBottom, 50);
      }
    };

    load();
  }, [isAuthenticated, navigate, otherUserId, productId, embedded]);

  useEffect(() => {
    return () => {
      try {
        localStorage.removeItem("chat:activeKey");
      } catch (_) {
        // ignore
      }
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !productId || !otherUserId) return;

    const socket = createSocket();
    socketRef.current = socket;

    socket.emit("join_product_chat", { productId });

    const onNew = (msg) => {
      if (String(msg.productId) !== String(productId)) return;
      const involved =
        (String(msg.senderId) === String(myId) && String(msg.receiverId) === String(otherUserId)) ||
        (String(msg.senderId) === String(otherUserId) && String(msg.receiverId) === String(myId));
      if (!involved) return;

      setMessages((prev) => {
        if (prev.some((m) => String(m._id) === String(msg._id))) return prev;
        return [...prev, msg];
      });
      setLastMessageForConversation(productId, otherUserId, msg.message);
      setTimeout(scrollToBottom, 10);
    };

    socket.on("new_message", onNew);

    return () => {
      socket.off("new_message", onNew);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, myId, otherUserId, productId]);

  const handleSend = async (e) => {
    e.preventDefault();
    setError("");

    const message = text.trim();
    if (!message) return;
    if (!socketRef.current) {
      setError("Chat not connected.");
      return;
    }

    setSending(true);
    try {
      socketRef.current.emit("send_message", {
        productId,
        receiverId: otherUserId,
        message,
      });
      setText("");
      setLastMessageForConversation(productId, otherUserId, message);
    } catch (err) {
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  const headerTitleBlock = (
    <div className="d-flex align-items-center gap-3 flex-wrap">
      {peerAvatar ? (
        <Image
          src={getImageUrl(peerAvatar, { placeholderSize: 96 })}
          roundedCircle
          className="chat-header-avatar"
          alt=""
        />
      ) : (
        <div className="chat-header-avatar-placeholder" aria-hidden>
          {(peerName || "U").charAt(0).toUpperCase()}
        </div>
      )}
      <div>
        <div className="chat-header-user fw-semibold">{peerName || "User"}</div>
        <div className="chat-header-product text-muted small">{productTitle}</div>
      </div>
    </div>
  );

  const header = (
    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      {headerTitleBlock}
      {showOuterBack && (
        <Button variant="outline-secondary" onClick={handleBack}>
          Back
        </Button>
      )}
    </div>
  );

  const card = (
    <Card className="shadow-sm chat-card">
      <Card.Body className="chat-body">
        {loading ? (
          <div className="text-center py-5">
            <Spinner />
          </div>
        ) : error ? (
          <Alert variant="danger" className="mb-0">
            {error}
          </Alert>
        ) : (
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="text-muted text-center py-4">No messages yet. Say hi.</div>
            ) : (
              messages.map((m) => {
                const mine = String(m.senderId) === String(myId);
                return (
                  <div key={m._id} className={`chat-row ${mine ? "mine" : "theirs"}`}>
                    <div className={`chat-bubble ${mine ? "mine" : "theirs"}`}>
                      <div className="chat-text">{m.message}</div>
                      <div className="chat-time">
                        {m.createdAt
                          ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : ""}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </Card.Body>

      <Card.Footer className="chat-footer">
        <Form onSubmit={handleSend} className="d-flex gap-2">
          <Form.Control
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            disabled={loading || !!error}
          />
          <Button type="submit" variant="primary" disabled={sending || loading || !!error}>
            {sending ? "Sending…" : "Send"}
          </Button>
        </Form>
      </Card.Footer>
    </Card>
  );

  if (embedded) {
    return (
      <div className="h-100 d-flex flex-column min-h-0">
        <div className="mb-3 flex-shrink-0 chat-embedded-header">{headerTitleBlock}</div>
        <div className="flex-grow-1 d-flex flex-column min-h-0">{card}</div>
      </div>
    );
  }

  return (
    <Container className="py-4 chat-page" style={{ maxWidth: 900 }}>
      {header}
      {card}
    </Container>
  );
}

const Chat = () => {
  return <ChatConversation embedded={false} showOuterBack />;
};

export default Chat;
