const content = document.getElementById('content');

// Utils
function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadFromStorage(key) {
  return JSON.parse(localStorage.getItem(key)) || {};
}

let currentUser = null;

function showLoginPage() {
  content.innerHTML = `
    <style>
      @media (max-width: 600px) {
        #app-container {
          flex-direction: column;
        }
        #sidebar {
          width: 100%;
          flex-direction: row;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-around;
        }
        .nav-btn {
          width: auto;
          margin: 5px;
        }
        #main-content {
          padding: 15px;
        }
      }
    </style>
    <div style="text-align:center; margin-top:100px;">
      <h1>Free Thoughts</h1>
      <button onclick="showLoginForm()">Login</button>
      <button onclick="showCreateAccountForm()">Create Account</button>
    </div>
  `;
}

function showLoginForm() {
  content.innerHTML = `
    <div style="text-align:center; margin-top:100px;">
      <h2>Login</h2>
      <input id="loginName" placeholder="Name" /><br><br>
      <input id="loginPass" placeholder="Password" type="password" /><br><br>
      <button onclick="login()">Login</button>
      <button onclick="showLoginPage()">Back</button>
    </div>
  `;
}

function showCreateAccountForm() {
  content.innerHTML = `
    <div style="text-align:center; margin-top:100px;">
      <h2>Create Account</h2>
      <input id="newName" placeholder="Name" /><br><br>
      <input id="newPass" placeholder="Password" type="password" /><br><br>
      <button onclick="createAccount()">Create</button>
      <button onclick="showLoginPage()">Back</button>
    </div>
  `;
}

function createAccount() {
  const name = document.getElementById("newName").value.trim();
  const pass = document.getElementById("newPass").value.trim();
  let users = loadFromStorage("users");

  if (!name || !pass) {
    alert("Enter both name and password.");
    return;
  }

  if (users[name]) {
    alert("Username already taken.");
    return;
  }

  users[name] = { password: pass, posts: [], likes: 0, dislikes: 0 };
  saveToStorage("users", users);
  alert("Account created!");
  showLoginForm();
}

function login() {
  const name = document.getElementById("loginName").value.trim();
  const pass = document.getElementById("loginPass").value.trim();
  let users = loadFromStorage("users");

  if (users[name] && users[name].password === pass) {
    currentUser = name;
    showMainUI();
  } else {
    alert("Invalid credentials.");
  }
}

function logout() {
  const confirmLogout = confirm("Are you sure you want to log out?");
  if (confirmLogout) {
    currentUser = null;
    showLoginPage();
  }
}

function showMainUI() {
  content.innerHTML = `
    <style>
      @media (max-width: 600px) {
        #app-container {
          flex-direction: column;
        }
        #sidebar {
          width: 100%;
          flex-direction: row;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-around;
        }
        .nav-btn {
          width: auto;
          margin: 5px;
        }
        #main-content {
          padding: 15px;
        }
      }
    </style>
    <div id="app-container">
      <div id="sidebar">
        <h2>Free Thoughts</h2>
        <button class="nav-btn" onclick="showFeed()">FEED</button>
        <button class="nav-btn" onclick="showYourPosts()">UR POST</button>
        <button class="nav-btn" onclick="showProfile()">UR PROFILE</button>
        <button class="nav-btn" onclick="logout()">LOG OUT</button>
      </div>
      <div id="main-content"></div>
    </div>
  `;
  showFeed();
}

function showFeed() {
  const posts = loadFromStorage("posts");
  const users = loadFromStorage("users");
  const main = document.getElementById("main-content");
  main.innerHTML = `<h2>Feed</h2>`;

  Object.entries(posts).forEach(([id, post]) => {
    const userReact = post.reactions[currentUser] || null;
    main.innerHTML += `
      <div class="post">
        <strong>${post.author}</strong><br>
        <p>${post.text}</p>
        <button class="reaction-btn" onclick="likePost('${id}')">👍 ${post.likes}</button>
        <button class="reaction-btn" onclick="dislikePost('${id}')">👎 ${post.dislikes}</button>
      </div>
    `;
  });
}

function likePost(postId) {
  const posts = loadFromStorage("posts");
  const users = loadFromStorage("users");
  const post = posts[postId];
  const user = users[post.author];

  if (post.reactions[currentUser] === "like") {
    return;
  }

  if (post.reactions[currentUser] === "dislike") {
    post.dislikes--;
    user.dislikes--;
  }

  post.reactions[currentUser] = "like";
  post.likes++;
  user.likes++;

  saveToStorage("posts", posts);
  saveToStorage("users", users);
  showFeed();
}

function dislikePost(postId) {
  const posts = loadFromStorage("posts");
  const users = loadFromStorage("users");
  const post = posts[postId];
  const user = users[post.author];

  if (post.reactions[currentUser] === "dislike") {
    return;
  }

  if (post.reactions[currentUser] === "like") {
    post.likes--;
    user.likes--;
  }

  post.reactions[currentUser] = "dislike";
  post.dislikes++;
  user.dislikes++;

  saveToStorage("posts", posts);
  saveToStorage("users", users);
  showFeed();
}

function showYourPosts() {
  const posts = loadFromStorage("posts");
  const main = document.getElementById("main-content");
  main.innerHTML = `<h2>Your Posts</h2>`;

  Object.entries(posts).forEach(([id, post]) => {
    if (post.author === currentUser) {
      main.innerHTML += `
        <div class="post">
          <p>${post.text}</p>
          <p>👍 ${post.likes} | 👎 ${post.dislikes}</p>
        </div>
      `;
    }
  });

  main.innerHTML += `
    <br><textarea id="newPost" rows="4" cols="50" placeholder="Write your thought..."></textarea><br>
    <button onclick="createPost()">Post</button>
  `;
}

function createPost() {
  const text = document.getElementById("newPost").value.trim();
  if (!text) return alert("Write something!");

  const posts = loadFromStorage("posts");
  const users = loadFromStorage("users");
  const id = Date.now().toString();

  posts[id] = {
    author: currentUser,
    text,
    likes: 0,
    dislikes: 0,
    reactions: {},
  };

  users[currentUser].posts.push(id);
  saveToStorage("posts", posts);
  saveToStorage("users", users);
  showYourPosts();
}

function showProfile() {
  const users = loadFromStorage("users");
  const user = users[currentUser];
  const main = document.getElementById("main-content");
  main.innerHTML = `
    <h2>Your Profile</h2>
    <p><strong>Name:</strong> ${currentUser}</p>
    <p><strong>Total Posts:</strong> ${user.posts.length}</p>
    <p><strong>Likes Received:</strong> ${user.likes}</p>
    <p><strong>Dislikes Received:</strong> ${user.dislikes}</p>
  `;
}

// Initial screen
showLoginPage();
