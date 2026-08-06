// utils/db.mjs

let categories = [
  { id: 1, name: "Technology" },
  { id: 2, name: "Health" },
  { id: 3, name: "Business" }
];

let statuses = [
  { id: 1, status: "Draft" },
  { id: 2, status: "Published" }
];

let users = [
  { id: "mock-admin-id", username: "admin", name: "Admin User", role: "admin", profile_pic: null },
  { id: "mock-user-id", username: "user", name: "Regular User", role: "user", profile_pic: null }
];

let posts = [
  { id: 1, title: "Mock Post 1", image: "https://mock-supabase-storage.com/my-personal-blog/posts/1.png", category_id: 1, description: "Description 1", content: "Content 1", status_id: 2, date: new Date().toISOString() },
  { id: 2, title: "Mock Post 2", image: "https://mock-supabase-storage.com/my-personal-blog/posts/2.png", category_id: 2, description: "Description 2", content: "Content 2", status_id: 2, date: new Date().toISOString() }
];

class MockPool {
  async query(text, values = []) {
    const queryText = text.trim().replace(/\s+/g, " ");

    // --- USERS QUERIES ---
    if (queryText.includes("FROM users WHERE username =")) {
      const username = values[0];
      const match = users.filter(u => u.username === username);
      return { rows: match };
    }

    if (queryText.includes("INSERT INTO users")) {
      const newUser = {
        id: values[0],
        username: values[1],
        name: values[2],
        role: values[3] || "user",
        profile_pic: null
      };
      users.push(newUser);
      return { rows: [newUser] };
    }

    if (queryText.includes("FROM users WHERE id =")) {
      const id = values[0];
      const match = users.filter(u => u.id === id);
      return { rows: match };
    }

    if (queryText.includes("UPDATE users")) {
      const userId = values[values.length - 1];
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        if (values.length >= 2) {
          if (queryText.includes("name =") && queryText.includes("username =") && queryText.includes("profile_pic =")) {
            users[userIndex].name = values[0];
            users[userIndex].username = values[1];
            users[userIndex].profile_pic = values[2];
          } else {
            let valIdx = 0;
            if (queryText.includes("name =")) users[userIndex].name = values[valIdx++];
            if (queryText.includes("username =")) users[userIndex].username = values[valIdx++];
            if (queryText.includes("profile_pic =")) users[userIndex].profile_pic = values[valIdx++];
          }
        }
        return { rowCount: 1, rows: [users[userIndex]] };
      }
      return { rowCount: 0, rows: [] };
    }

    // --- CATEGORIES QUERIES ---
    if (queryText.startsWith("SELECT * FROM categories ORDER BY id") || queryText.startsWith("SELECT * FROM categories")) {
      return { rows: categories };
    }

    if (queryText.includes("FROM categories WHERE id =")) {
      const id = Number(values[0]);
      const match = categories.filter(c => c.id === id);
      return { rows: match };
    }

    if (queryText.includes("INSERT INTO categories")) {
      const newCat = { id: categories.length + 1, name: values[0] };
      categories.push(newCat);
      return { rowCount: 1, rows: [newCat] };
    }

    if (queryText.includes("UPDATE categories")) {
      const name = values[0];
      const id = Number(values[1]);
      const cat = categories.find(c => c.id === id);
      if (cat) {
        cat.name = name;
        return { rowCount: 1 };
      }
      return { rowCount: 0 };
    }

    if (queryText.includes("DELETE FROM categories")) {
      const id = Number(values[0]);
      const idx = categories.findIndex(c => c.id === id);
      if (idx !== -1) {
        categories.splice(idx, 1);
        return { rowCount: 1 };
      }
      return { rowCount: 0 };
    }

    // --- POSTS QUERIES ---
    if (queryText.startsWith("INSERT INTO posts")) {
      const newPost = {
        id: posts.length + 1,
        title: values[0],
        image: values[1],
        category_id: Number(values[2]),
        description: values[3],
        content: values[4],
        status_id: Number(values[5]),
        date: new Date().toISOString()
      };
      posts.push(newPost);
      return { rowCount: 1, rows: [newPost] };
    }

    if (queryText.startsWith("SELECT COUNT(*) FROM posts") || queryText.includes("COUNT(*)")) {
      const filtered = this.filterPosts(queryText, values);
      return { rows: [{ count: filtered.length }] };
    }

    if (queryText.includes("SELECT posts.*") && queryText.includes("posts.id =")) {
      const id = Number(values[0]);
      const post = posts.find(p => p.id === id);
      if (post) {
        const categoryObj = categories.find(c => c.id === post.category_id);
        const statusObj = statuses.find(s => s.id === post.status_id);
        return {
          rows: [{
            ...post,
            category: categoryObj ? categoryObj.name : null,
            status: statusObj ? statusObj.status : null
          }]
        };
      }
      return { rows: [] };
    }

    if (queryText.includes("SELECT posts.*")) {
      const filtered = this.filterPosts(queryText, values);
      return { rows: filtered };
    }

    if (queryText.includes("UPDATE posts")) {
      const id = Number(values[0]);
      const postIndex = posts.findIndex(p => p.id === id);
      if (postIndex !== -1) {
        posts[postIndex] = {
          ...posts[postIndex],
          title: values[1],
          image: values[2],
          category_id: Number(values[3]),
          description: values[4],
          content: values[5],
          status_id: Number(values[6]),
          date: values[7] || new Date().toISOString()
        };
        return { rowCount: 1 };
      }
      return { rowCount: 0 };
    }

    if (queryText.includes("DELETE FROM posts")) {
      const id = Number(values[0]);
      const idx = posts.findIndex(p => p.id === id);
      if (idx !== -1) {
        posts.splice(idx, 1);
        return { rowCount: 1 };
      }
      return { rowCount: 0 };
    }

    return { rows: [], rowCount: 0 };
  }

  filterPosts(queryText, values) {
    let filtered = [...posts];

    if (queryText.includes("statuses.id = 2")) {
      filtered = filtered.filter(p => p.status_id === 2);
    }

    let keyword = null;
    let category = null;

    if (queryText.includes("categories.name ILIKE") && queryText.includes("posts.title ILIKE")) {
      category = values[0]?.replace(/%/g, "");
      keyword = values[1]?.replace(/%/g, "");
    } else if (queryText.includes("categories.name ILIKE")) {
      category = values[0]?.replace(/%/g, "");
    } else if (queryText.includes("posts.title ILIKE") || queryText.includes("posts.description ILIKE")) {
      keyword = values[0]?.replace(/%/g, "");
    }

    if (category) {
      filtered = filtered.filter(p => {
        const cat = categories.find(c => c.id === p.category_id);
        return cat && cat.name.toLowerCase().includes(category.toLowerCase());
      });
    }

    if (keyword) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(keyword.toLowerCase()) ||
        p.description.toLowerCase().includes(keyword.toLowerCase()) ||
        p.content.toLowerCase().includes(keyword.toLowerCase())
      );
    }

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (queryText.includes("LIMIT") && queryText.includes("OFFSET")) {
      const limitVal = values[values.length - 2];
      const offsetVal = values[values.length - 1];
      if (typeof limitVal === "number" && typeof offsetVal === "number") {
        filtered = filtered.slice(offsetVal, offsetVal + limitVal);
      }
    }

    return filtered.map(p => {
      const cat = categories.find(c => c.id === p.category_id);
      const stat = statuses.find(s => s.id === p.status_id);
      return {
        ...p,
        category: cat ? cat.name : null,
        status: stat ? stat.status : null
      };
    });
  }
}

const connectionPool = new MockPool();
export default connectionPool;
