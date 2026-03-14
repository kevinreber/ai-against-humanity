import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/** Get user's notifications (newest first) */
export const getNotifications = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, { userId, limit }) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit ?? 20);
    return notifications;
  },
});

/** Get unread notification count */
export const getUnreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("read"), false))
      .collect();
    return unread.length;
  },
});

/** Mark a notification as read */
export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    await ctx.db.patch(notificationId, { read: true });
  },
});

/** Mark all notifications as read */
export const markAllRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("read"), false))
      .collect();

    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true });
    }
  },
});

/** Create a notification */
export const createNotification = mutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    message: v.string(),
    data: v.optional(v.string()),
  },
  handler: async (ctx, { userId, type, message, data }) => {
    return ctx.db.insert("notifications", {
      userId,
      type,
      message,
      data,
      read: false,
      createdAt: Date.now(),
    });
  },
});
