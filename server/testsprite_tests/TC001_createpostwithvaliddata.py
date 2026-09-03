import requests

BASE_URL = "http://localhost:4001"
TIMEOUT = 30

# Admin credentials for login (assumed known for test)
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "AdminPass123!"

def test_create_post_with_valid_data():
    # Login as admin to get access token
    login_url = f"{BASE_URL}/auth/login"
    login_data = {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    try:
        login_resp = requests.post(login_url, json=login_data, timeout=TIMEOUT)
        login_resp.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Login request failed: {e}"
    login_json = login_resp.json()
    assert "access_token" in login_json, "No access_token found in login response"
    token = login_json["access_token"]
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # Prepare valid post data
    post_data = {
        "title": "Test Post Title",
        "image": "https://example.com/image.jpg",
        "category_id": 1,
        "description": "This is a test post description.",
        "content": "This is the detailed content of the test post.",
        "status_id": 1
    }

    # Create the post
    create_url = f"{BASE_URL}/posts"
    post_id = None
    try:
        response = requests.post(create_url, json=post_data, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
        resp_json = response.json()
        assert resp_json.get("message") == "Created post successfully", f"Unexpected create message: {resp_json.get('message')}"

        # Extract postId from Location header or response if available, else from followup get
        # If no explicit postId in response, try getting last created post or response location header
        # But the PRD does not specify returning postId on create - so we get list and find it by title as fallback
        # Here attempt to use GET /posts/admin (admin view) to find post ID by title

        # Fetch all posts with admin rights to find created post
        admin_posts_url = f"{BASE_URL}/posts/admin"
        admin_resp = requests.get(admin_posts_url, headers=headers, timeout=TIMEOUT)
        admin_resp.raise_for_status()
        posts_json = admin_resp.json()
        posts = posts_json.get("posts", [])
        matching_posts = [p for p in posts if p.get("title") == post_data["title"] and p.get("description") == post_data["description"]]
        assert matching_posts, "Created post not found in admin posts list"
        post_id = matching_posts[0]["id"]
        assert post_id, "Created post does not have an ID"

        # Retrieve the post by GET /posts/{postId}
        get_post_url = f"{BASE_URL}/posts/{post_id}"
        get_resp = requests.get(get_post_url, timeout=TIMEOUT)
        assert get_resp.status_code == 200, f"Expected 200 on GET post, got {get_resp.status_code}"
        get_post = get_resp.json()
        # Validate returned post data matches creation data (some fields may differ like timestamps)
        assert get_post.get("title") == post_data["title"], "Post title mismatch"
        assert get_post.get("image") == post_data["image"], "Post image mismatch"
        assert get_post.get("category_id") == post_data["category_id"], "Post category_id mismatch"
        assert get_post.get("description") == post_data["description"], "Post description mismatch"
        assert get_post.get("content") == post_data["content"], "Post content mismatch"
        assert get_post.get("status_id") == post_data["status_id"], "Post status_id mismatch"

    finally:
        # Cleanup: delete the created post if created
        if post_id:
            delete_url = f"{BASE_URL}/posts/{post_id}"
            try:
                del_resp = requests.delete(delete_url, headers=headers, timeout=TIMEOUT)
                # Accept 200 success or 404 not found (if already deleted)
                assert del_resp.status_code in (200, 404), f"Unexpected status code deleting post: {del_resp.status_code}"
            except requests.RequestException:
                pass

test_create_post_with_valid_data()