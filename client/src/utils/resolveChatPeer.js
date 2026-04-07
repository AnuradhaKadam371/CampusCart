import api from "./api";

/**
 * Resolve the other participant's display name and avatar using existing
 * product + order APIs (no new backend endpoints).
 */
export async function resolveChatPeer(productId, otherUserId, myId) {
  if (!productId || !otherUserId || !myId) {
    return { name: null, avatar: null };
  }

  const oid = String(otherUserId);
  const mid = String(myId);

  try {
    const { data: product } = await api.get(`/products/${productId}`);
    const seller = product?.sellerId;
    if (!seller) return { name: null, avatar: null };

    const sellerIdStr = String(seller._id || seller);
    if (sellerIdStr === oid) {
      return { name: seller.name || "User", avatar: seller.avatar || null };
    }

    if (sellerIdStr === mid) {
      const [a, b, c] = await Promise.all([
        api.get("/orders/seller-requests").catch(() => ({ data: [] })),
        api.get("/orders/seller-upcoming-shipping").catch(() => ({ data: [] })),
        api.get("/orders/seller-completed-orders").catch(() => ({ data: [] })),
      ]);
      const orders = [...(a.data || []), ...(b.data || []), ...(c.data || [])];
      const order = orders.find((o) => String(o.productId) === String(productId));
      const buyer = order?.buyerId;
      if (buyer && String(buyer._id || buyer) === oid) {
        return { name: buyer.name || "User", avatar: buyer.avatar || null };
      }
    } else {
      const { data: orders } = await api.get("/orders/my-all-requests").catch(() => ({ data: [] }));
      const order = (orders || []).find((o) => String(o.productId) === String(productId));
      const s = order?.sellerId;
      if (s && String(s._id || s) === oid) {
        return { name: s.name || "User", avatar: s.avatar || null };
      }
    }
  } catch {
    // fall through
  }

  return { name: null, avatar: null };
}
