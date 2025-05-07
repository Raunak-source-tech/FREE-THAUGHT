// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBtN7UPljPlQjy7ROmEX5yJDEzJzc_LxME",
  authDomain: "free-thaught.firebaseapp.com",
  projectId: "free-thaught",
  storageBucket: "free-thaught.firebasestorage.app",
  messagingSenderId: "427640389767",
  appId: "1:427640389767:web:8aa95b8a4bf9554b8af822",
  measurementId: "G-3VVN7S602R"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Utils for Firebase
function saveToDatabase(key, value) {
  const reference = db.ref(key);
  reference.set(value);
}

function loadFromDatabase(key, callback) {
  const reference = db.ref(key);
  reference.once('value', (snapshot) => {
    callback(snapshot.val() || {});
  });
}

let currentUser = null;

// Show login page
function showLoginPage() {
  document.getElementById('content').innerHTML = `
    <div style="text-align:center; margin-top:100px;">
      <h1>Free Thoughts</h1>
      <button onclick="showLoginForm()">Login</button>
      <button onclick="showCreateAccountForm()">Create Account</button>
    </div>
  `;
}

// Show login form
function showLoginForm() {
  document.getElementById('content').innerHTML = `
    <div style="text-align:center; margin-top:100px;">
      <h2>Login</h2>
      <input id="loginName" placeholder="Name" /><br><br>
      <input id="loginPass" placeholder="Password" type="password" /><br><br>
      <button onclick="login()">Login</button>
      <button onclick="showLoginPage()">Back</button>
    </div>
  `;
}

// Show create account form
function showCreateAccountForm() {
  document.getElementById('content').innerHTML = `
    <div style="text-align:center; margin-top:100px;">
      <h2>Create Account</h2>
      <input id="newName" placeholder="Name" /><br><br>
      <input id="newPass" placeholder="Password" type="password" /><br><br>
      <button onclick="createAccount()">Create</button>
      <button onclick="showLoginPage()">Back</button>
    </div>
  `;
}

// Create account in Firebase
function createAccount() {
  const name = document.getElementById("newName").value.trim();
  const pass = document.getElementById("newPass").value.trim();

  if (!name || !pass) {
    alert("Enter both name and password.");
    return;
  }

  loadFromDatabase('users', (users) => {
    if (users[name]) {
      alert("Username already taken.");
      return;
    }

    users[name] = { password: pass, posts: [], likes: 0, dislikes: 0 };
    saveToDatabase("users", users);
    alert("Account created!");
    showLoginForm();
  });
}

// Login with Firebase
function login() {
  const name = document.getElementById("loginName").value.trim();
  const pass = document.getElementById("loginPass").value.trim();

  loadFromDatabase('users', (users) => {
    if (users[name] && users[name].password === pass) {
      currentUser = name;
      showMainUI();
    } else {
      alert("Invalid credentials.");
    }
  });
}

// Log out
function logout() {
  const confirmLogout = confirm("Are you sure you want to log out?");
  if (confirmLogout) {
    currentUser = null;
    showLoginPage();
  }
}

// Show the main UI with the sidebar
function showMainUI() {
  document.getElementById('content').innerHTML = `
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

// Show feed (all posts)
function showFeed() {
  loadFromDatabase('posts', (posts) => {
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
  });
}

// Like a post
function likePost(postId) {
  loadFromDatabase('posts', (posts) => {
    const post = posts[postId];
    loadFromDatabase('users', (users) => {
      const user = users[post.author];

      if (post.reactions[currentUser] === "like") return;
      if (post.reactions[currentUser] === "dislike") {
        post.dislikes--;
        user.dislikes--;
      }

      post.reactions[currentUser] = "like";
      post.likes++;
      user.likes++;

      saveToDatabase("posts", posts);
      saveToDatabase("users", users);
      showFeed();
    });
  });
}

// Dislike a post
function dislikePost(postId) {
  loadFromDatabase('posts', (posts) => {
    const post = posts[postId];
    loadFromDatabase('users', (users) => {
      const user = users[post.author];

      if (post.reactions[currentUser] === "dislike") return;
      if (post.reactions[currentUser] === "like") {
        post.likes--;
        user.likes--;
      }

      post.reactions[currentUser] = "dislike";
      post.dislikes++;
      user.dislikes++;

      saveToDatabase("posts", posts);
      saveToDatabase("users", users);
      showFeed();
    });
  });
}

// Show user's posts
function showYourPosts() {
  loadFromDatabase('posts', (posts) => {
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
  });
}

// Create a new post
function createPost() {
  const text = document.getElementById("newPost").value.trim();
  if (!text) return alert("Write something!");

  loadFromDatabase('posts', (posts) => {
    loadFromDatabase('users', (users) => {
      const id = Date.now().toString();

      posts[id] = {
        author: currentUser,
        text,
        likes: 0,
        dislikes: 0,
        reactions: {},
      };

      users[currentUser].posts.push(id);
      saveToDatabase("posts", posts);
      saveToDatabase("users", users);
      showYourPosts();
    });
  });
}

// Show user's profile
function showProfile() {
  loadFromDatabase('users', (users) => {
    const user = users[currentUser];
    const main = document.getElementById("main-content");
    main.innerHTML = `
      <h2>Your Profile</h2>
      <p><strong>Name:</strong> ${currentUser}</p>
      <p><strong>Total Posts:</strong> ${user.posts.length}</p>
      <p><strong>Likes Received:</strong> ${user.likes}</p>
      <p><strong>Dislikes Received:</strong> ${user.dislikes}</p>
    `;
  });
}

// Initialize with login page
showLoginPage();
