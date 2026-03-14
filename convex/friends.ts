import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/** Send a friend request */
export const sendRequest = mutation({
  args: { userId: v.id("users"), friendUsername: v.string() },
  handler: async (ctx, { userId, friendUsername }) => {
    const friend = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", friendUsername))
      .first();

    if (!friend) throw new Error("User not found");
    if (friend._id === userId) throw new Error("Cannot friend yourself");

    // Check for existing friendship
    const existing = await ctx.db
      .query("friends")
      .withIndex("by_user_and_friend", (q) =>
        q.eq("userId", userId).eq("friendId", friend._id)
      )
      .first();

    if (existing) throw new Error("Friend request already sent");

    // Check reverse direction too
    const reverse = await ctx.db
      .query("friends")
      .withIndex("by_user_and_friend", (q) =>
        q.eq("userId", friend._id).eq("friendId", userId)
      )
      .first();

    if (reverse) throw new Error("This user already sent you a request");

    await ctx.db.insert("friends", {
      userId,
      friendId: friend._id,
      status: "pending",
      createdAt: Date.now(),
    });

    // Notify the friend
    const user = await ctx.db.get(userId);
    await ctx.db.insert("notifications", {
      userId: friend._id,
      type: "friend_request",
      message: `${user?.username ?? "Someone"} sent you a friend request`,
      data: JSON.stringify({ fromUserId: userId }),
      read: false,
      createdAt: Date.now(),
    });
  },
});

/** Accept a friend request */
export const acceptRequest = mutation({
  args: { userId: v.id("users"), friendshipId: v.id("friends") },
  handler: async (ctx, { userId, friendshipId }) => {
    const friendship = await ctx.db.get(friendshipId);
    if (!friendship) throw new Error("Request not found");
    if (friendship.friendId !== userId) throw new Error("Not your request to accept");

    await ctx.db.patch(friendshipId, { status: "accepted" });

    // Create reverse friendship
    await ctx.db.insert("friends", {
      userId,
      friendId: friendship.userId,
      status: "accepted",
      createdAt: Date.now(),
    });

    // Notify
    const user = await ctx.db.get(userId);
    await ctx.db.insert("notifications", {
      userId: friendship.userId,
      type: "friend_accepted",
      message: `${user?.username ?? "Someone"} accepted your friend request`,
      read: false,
      createdAt: Date.now(),
    });
  },
});

/** Remove a friend */
export const removeFriend = mutation({
  args: { userId: v.id("users"), friendId: v.id("users") },
  handler: async (ctx, { userId, friendId }) => {
    // Remove both directions
    const forward = await ctx.db
      .query("friends")
      .withIndex("by_user_and_friend", (q) =>
        q.eq("userId", userId).eq("friendId", friendId)
      )
      .first();
    if (forward) await ctx.db.delete(forward._id);

    const reverse = await ctx.db
      .query("friends")
      .withIndex("by_user_and_friend", (q) =>
        q.eq("userId", friendId).eq("friendId", userId)
      )
      .first();
    if (reverse) await ctx.db.delete(reverse._id);
  },
});

/** Get friends list */
export const getFriends = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const friendships = await ctx.db
      .query("friends")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    const friends = await Promise.all(
      friendships.map(async (f) => {
        const friend = await ctx.db.get(f.friendId);
        return friend ? {
          friendshipId: f._id,
          userId: friend._id,
          username: friend.username,
          avatar: friend.avatar,
          level: friend.level ?? 1,
          title: friend.title,
          gamesWon: friend.gamesWon,
        } : null;
      })
    );

    return friends.filter(Boolean);
  },
});

/** Get pending friend requests (received) */
export const getPendingRequests = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const requests = await ctx.db
      .query("friends")
      .withIndex("by_friend", (q) => q.eq("friendId", userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const requestsWithUsers = await Promise.all(
      requests.map(async (r) => {
        const user = await ctx.db.get(r.userId);
        return user ? {
          friendshipId: r._id,
          userId: user._id,
          username: user.username,
          avatar: user.avatar,
        } : null;
      })
    );

    return requestsWithUsers.filter(Boolean);
  },
});
