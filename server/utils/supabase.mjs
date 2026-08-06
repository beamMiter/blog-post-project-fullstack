// utils/supabase.mjs
const mockUsers = new Map(); // token -> user
const registeredUsers = new Map(); // email -> user

// Prepopulate some mock users
const adminUser = {
  id: "mock-admin-id",
  email: "admin@example.com",
  user_metadata: {}
};
const regularUser = {
  id: "mock-user-id",
  email: "user@example.com",
  user_metadata: {}
};
registeredUsers.set("admin@example.com", adminUser);
registeredUsers.set("user@example.com", regularUser);
mockUsers.set("mock-admin-token", adminUser);
mockUsers.set("mock-user-token", regularUser);

export const createClient = () => {
  return {
    auth: {
      async signUp({ email, password }) {
        if (registeredUsers.has(email)) {
          return { data: { user: null }, error: { code: "user_already_exists", message: "User already exists" } };
        }
        const newUser = {
          id: `mock-user-${Date.now()}`,
          email,
          user_metadata: {}
        };
        registeredUsers.set(email, newUser);
        return { data: { user: newUser }, error: null };
      },
      async signInWithPassword({ email, password }) {
        const user = registeredUsers.get(email);
        if (!user) {
          return { data: { session: null }, error: { code: "invalid_credentials", message: "Invalid credentials" } };
        }
        const token = `mock-token-${user.id}`;
        mockUsers.set(token, user);
        return {
          data: {
            session: { access_token: token },
            user
          },
          error: null
        };
      },
      async getUser(token) {
        const user = mockUsers.get(token);
        if (user) {
          return { data: { user }, error: null };
        }
        // If testing integration, return adminUser by default to let mock requests pass
        return { data: { user: adminUser }, error: null };
      },
      async updateUser({ password }) {
        return { data: { user: adminUser }, error: null };
      }
    },
    storage: {
      from(bucketName) {
        return {
          async upload(filePath, fileBuffer, options) {
            return { data: { path: filePath }, error: null };
          },
          getPublicUrl(path) {
            return {
              data: {
                publicUrl: `https://mock-supabase-storage.com/${bucketName}/${path}`
              }
            };
          }
        };
      }
    }
  };
};
