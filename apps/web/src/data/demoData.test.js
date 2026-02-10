/**
 * Unit Tests for demoData.js
 * Tests all demo data helper functions
 */

import { describe, it, expect } from "vitest";
import {
  DEMO_USERS,
  DEMO_RESPONSES,
  DEMO_LIKES,
  isDemoUser,
  isDemoId,
  getDemoUser,
  getAllDemoUsers,
  getDiscoverDemoUsers,
  getDemoProfiles,
  getDemoResponses,
  getDemoStories,
  getDemoNotifications,
  getDemoLikes,
  getDemoChatUsers,
  getDemoTempChats,
  getDemoFollows,
  createDemoChat,
  getDemoMessages,
  getDemoAnalytics,
} from "./demoData";

describe("[P2][infra] demoData Constants", () => {
  describe("DEMO_USERS", () => {
    it("should have 5 demo users", () => {
      expect(Object.keys(DEMO_USERS)).toHaveLength(5);
    });

    it("should have all required user fields", () => {
      Object.values(DEMO_USERS).forEach((user) => {
        expect(user).toHaveProperty("id");
        expect(user).toHaveProperty("nickname");
        expect(user).toHaveProperty("age");
        expect(user).toHaveProperty("gender");
        expect(user).toHaveProperty("bio");
        expect(user).toHaveProperty("profile_images");
      });
    });

    it("should have valid ages (18+)", () => {
      Object.values(DEMO_USERS).forEach((user) => {
        expect(user.age).toBeGreaterThanOrEqual(18);
      });
    });
  });

  describe("DEMO_RESPONSES", () => {
    it("should have demo responses", () => {
      expect(DEMO_RESPONSES.length).toBeGreaterThan(0);
    });
  });

  describe("DEMO_LIKES", () => {
    it("should have romantic and positive like types", () => {
      expect(DEMO_LIKES).toHaveProperty("romantic");
      expect(DEMO_LIKES).toHaveProperty("positive");
    });
  });
});

describe("[P2][infra] isDemoUser", () => {
  it("should return true for demo-* prefixed IDs", () => {
    expect(isDemoUser("demo-user-1")).toBe(true);
    expect(isDemoUser("demo-user-123")).toBe(true);
    expect(isDemoUser("demo-match-user-1-romantic")).toBe(true);
  });

  it("should return true for mock-user", () => {
    expect(isDemoUser("mock-user")).toBe(true);
  });

  it("should return false for real user IDs", () => {
    expect(isDemoUser("user-123")).toBe(false);
    expect(isDemoUser("abc123")).toBe(false);
  });

  it("should return false for null/undefined", () => {
    expect(isDemoUser(null)).toBe(false);
    expect(isDemoUser(undefined)).toBe(false);
    expect(isDemoUser("")).toBe(false);
  });
});

describe("[P2][infra] isDemoId", () => {
  it("should detect any demo- prefixed ID", () => {
    expect(isDemoId("demo-chat-1")).toBe(true);
    expect(isDemoId("demo-response-1")).toBe(true);
  });

  it("should return false for real IDs", () => {
    expect(isDemoId("chat-123")).toBe(false);
  });
});

describe("[P2][infra] getDemoUser", () => {
  it("should return demo user by standard ID", () => {
    const user = getDemoUser("demo-user-1");
    expect(user).not.toBeNull();
    expect(user.id).toBe("demo-user-1");
    expect(user.nickname).toBe("Sarah");
  });

  it("should resolve legacy IDs", () => {
    const user = getDemoUser("demo-match-user-1-romantic");
    expect(user).not.toBeNull();
    expect(user.id).toBe("demo-user-1");
  });

  it("should return fallback for unknown demo IDs", () => {
    const user = getDemoUser("demo-unknown-999");
    expect(user).not.toBeNull();
    expect(user.nickname).toBe("Demo User");
  });

  it("should return null for non-demo IDs", () => {
    expect(getDemoUser("real-user-123")).toBeNull();
  });
});

describe("[P2][infra] getAllDemoUsers", () => {
  it("should return all 5 demo users", () => {
    const users = getAllDemoUsers();
    expect(users).toHaveLength(5);
  });
});

describe("[P2][infra] getDemoProfiles", () => {
  it("should return all demo users", () => {
    const profiles = getDemoProfiles();
    expect(profiles).toHaveLength(5);
  });
});

describe("[P2][infra] getDemoResponses", () => {
  it("should return responses with user objects", () => {
    const responses = getDemoResponses();
    expect(responses.length).toBeGreaterThan(0);
    responses.forEach((response) => {
      expect(response).toHaveProperty("user");
    });
  });
});

describe("[P2][infra] getDemoLikes", () => {
  it("should return romantic likes", () => {
    const likes = getDemoLikes("romantic", "test-user");
    expect(Array.isArray(likes)).toBe(true);
  });

  it("should return empty array for unknown type", () => {
    const likes = getDemoLikes("unknown", "test-user");
    expect(likes).toEqual([]);
  });
});

describe("[P2][infra] getDemoChatUsers", () => {
  it("should return chat users with name and image", () => {
    const chatUsers = getDemoChatUsers();
    expect(chatUsers.length).toBeGreaterThan(0);
    chatUsers.forEach((chatUser) => {
      expect(chatUser).toHaveProperty("chatId");
      expect(chatUser).toHaveProperty("name");
    });
  });
});

describe("[P2][infra] getDemoTempChats", () => {
  it("should return temp chats with otherUser info", () => {
    const tempChats = getDemoTempChats("test-user");
    expect(tempChats.length).toBeGreaterThan(0);
    tempChats.forEach((chat) => {
      expect(chat.otherUser).toBeDefined();
      expect(chat.otherUser.id).toBeDefined();
      expect(chat.otherUser.first_name).toBeDefined();
    });
  });
});

describe("[P2][infra] getDemoFollows", () => {
  it("should return followers for demo user", () => {
    const followers = getDemoFollows("demo-user-1", "followers");
    expect(Array.isArray(followers)).toBe(true);
    expect(followers.length).toBeGreaterThan(0);
  });
});

describe("[P2][infra] createDemoChat", () => {
  it("should create a chat object with otherUser", () => {
    const chat = createDemoChat("demo-user-1");
    expect(chat).toHaveProperty("id");
    expect(chat.status).toBe("active");
    expect(chat.otherUser).toBeDefined();
    expect(chat.otherUser.id).toBe("demo-user-1");
    expect(chat.otherUser.first_name).toBeDefined();
  });
});

describe("[P2][infra] getDemoAnalytics", () => {
  it("should return analytics data structure", () => {
    const analytics = getDemoAnalytics();
    expect(analytics).toHaveProperty("likes");
    expect(analytics).toHaveProperty("chats");
    expect(analytics).toHaveProperty("responses");
  });
});

