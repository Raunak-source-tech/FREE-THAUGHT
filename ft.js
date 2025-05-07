// Firebase configuration
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
const db = firebase.firestore(app);
const analytics = firebase.analytics(app);

const content = document.getElementById('content');
let currentUser = null;

function showLoginPage() {
    content.innerHTML = `
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
    let users = JSON.parse(localStorage.getItem("users")) || {};

    if (!name || !pass) {
        alert("Enter both name and password.");
        return;
    }

    if (users[name]) {
        alert("Username already taken.");
        return;
    }

    users[name] = { password: pass, posts: [], likes: 0, dislikes: 0 };
    localStorage.setItem("users", JSON.stringify(users));
    alert("Account created!");
    showLoginForm();
}

function login() {
    const name = document.getElementById("loginName").value.trim();
    const pass = document.getElementById("loginPass").value.trim();
    let users = JSON.parse(localStorage.getItem("users")) || {};

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

// Show Feed
async function showFeed() {
    const postsRef = db.collection("posts");
    const snapshot = await postsRef.get();
    const posts = snapshot.docs.map(doc => doc.data());

    const main = document.getElementById("main-content");
    main.innerHTML = `<h2>Feed</h2>`;

    posts.forEach(post => {
        main.innerHTML += `
            <div class="post">
                <strong>${post.author}</strong><br>
                <p>${post.text}</p>
                <button class="reaction-btn" onclick="likePost('${post.id}')">👍 ${post.likes}</button>
                <button class="reaction-btn" onclick="dislikePost('${post.id}')">👎 ${post.dislikes}</button>
            </div>
        `;
    });
}

// Like Post
async function likePost(postId) {
    const postRef = db.collection("posts").doc(postId);
    const post = await postRef.get();
    const data = post.data();
    data.likes++;

    await postRef.update({ likes: data.likes });
    showFeed();
}

// Dislike Post
async function dislikePost(postId) {
    const postRef = db.collection("posts").doc(postId);
    const post = await postRef.get();
    const data = post.data();
    data.dislikes++;

    await postRef.update({ dislikes: data.dislikes });
    showFeed();
}

// Create Post
async function createPost() {
    const text = document.getElementById("newPost").value.trim();
    if (!text) return alert("Write something!");

    const postRef = db.collection("posts");
    await postRef.add({
        author: currentUser,
        text,
        likes: 0,
        dislikes: 0,
        createdAt: new Date()
    });

    showYourPosts();
}

// Show User Posts
async function showYourPosts() {
    const postsRef = db.collection("posts");
    const snapshot = await postsRef.get();
    const posts = snapshot.docs.filter(doc => doc.data().author === currentUser).map(doc => doc.data());

    const main = document.getElementById("main-content");
    main.innerHTML = `<h2>Your Posts</h2>`;

    posts.forEach(post => {
        main.innerHTML += `
            <div class="post">
                <p>${post.text}</p>
                <p>👍 ${post.likes} | 👎 ${post.dislikes}</p>
            </div>
        `;
    });
}

// Show Profile
async function showProfile() {
    const users = JSON.parse(localStorage.getItem("users")) || {};
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
