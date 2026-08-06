// middleware/postValidation.mjs

function validatePostData(req, res, next) {
  // Check if req.body is an object and exists
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body) || Object.keys(req.body).length === 0) {
    return res.status(400).json({ message: "Body is invalid" });
  }

  const { title, image, category_id, description, content, status_id } = req.body;

  // 1. Validate title
  if (title === undefined || title === null) {
    return res.status(400).json({ message: "Title is required" });
  }
  if (typeof title !== "string") {
    return res.status(400).json({ message: "Title must be a string" });
  }
  if (title.trim() === "") {
    return res.status(400).json({ message: "Title cannot be empty" });
  }
  if (title.length > 200) {
    return res.status(400).json({ message: "Title cannot exceed 200 characters" });
  }

  // 2. Validate image
  if (image === undefined || image === null) {
    return res.status(400).json({ message: "Image is required" });
  }
  if (typeof image !== "string") {
    return res.status(400).json({ message: "Image must be a string" });
  }
  if (image.trim() === "") {
    return res.status(400).json({ message: "Image cannot be empty" });
  }
  if (!image.startsWith("http://") && !image.startsWith("https://")) {
    return res.status(400).json({ message: "Image must be a valid URL starting with http:// or https://" });
  }

  // 3. Validate category_id
  if (category_id === undefined || category_id === null) {
    return res.status(400).json({ message: "Category ID is required" });
  }
  if (typeof category_id !== "number") {
    return res.status(400).json({ message: "Category ID must be a number" });
  }
  if (!Number.isInteger(category_id) || category_id < 1) {
    return res.status(400).json({ message: "Category ID must be a positive integer" });
  }

  // 4. Validate description
  if (description === undefined || description === null) {
    return res.status(400).json({ message: "Description is required" });
  }
  if (typeof description !== "string") {
    return res.status(400).json({ message: "Description must be a string" });
  }
  if (description.trim() === "") {
    return res.status(400).json({ message: "Description cannot be empty" });
  }
  if (description.length > 500) {
    return res.status(400).json({ message: "Description cannot exceed 500 characters" });
  }

  // 5. Validate content
  if (content === undefined || content === null) {
    return res.status(400).json({ message: "Content is required" });
  }
  if (typeof content !== "string") {
    return res.status(400).json({ message: "Content must be a string" });
  }
  if (content.trim() === "") {
    return res.status(400).json({ message: "Content cannot be empty" });
  }
  if (content.length > 5000) {
    return res.status(400).json({ message: "Content cannot exceed 5000 characters" });
  }

  // 6. Validate status_id
  if (status_id === undefined || status_id === null) {
    return res.status(400).json({ message: "Status ID is required" });
  }
  if (typeof status_id !== "number") {
    return res.status(400).json({ message: "Status ID must be a number" });
  }
  if (status_id !== 1 && status_id !== 2) {
    return res.status(400).json({ message: "Status ID must be 1 (Draft) or 2 (Published)" });
  }

  next();
}

export default validatePostData;
