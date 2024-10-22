import { db } from "./firebase.js"; // Authentication 없이 Firestore만 사용
import { getDoc, doc, getDocs, collection, query, orderBy } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

let postsData = [];  // 전체 게시물 데이터를 저장할 배열

// 로그인된 사용자의 역할 확인 (관리자면 업로드 및 회원가입 버튼 보이기)
document.addEventListener('DOMContentLoaded', async () => {
    const userId = sessionStorage.getItem('userId'); // 세션에서 로그인 정보 가져오기
    if (!userId) {
        window.location.href = '/login.html';  // 로그인되지 않은 경우 로그인 페이지로 이동
    } else {
        // Firestore에서 사용자 역할 가져오기
        const docRef = doc(db, "users", userId);
        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const userRole = docSnap.data().role;
                if (userRole === 'admin') {
                    document.getElementById('uploadBtn').style.display = 'block'; // 관리자에게만 업로드 버튼 표시
                    document.getElementById('signupBtn').style.display = 'block'; // 관리자에게만 회원가입 버튼 표시
                }
            } else {
                console.error('사용자를 찾을 수 없습니다.');
            }
        } catch (error) {
            console.error("역할 확인 오류:", error);
        }
    }

    loadPosts(); // 게시물 불러오기
});

// 검색 입력 필드의 입력 변화 감지
document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.trim();  // 입력된 검색어
    filterPosts(searchTerm);  // 검색어에 따라 게시물 필터링
});

// 게시물 필터링 함수 (검색어에 따라 필터링)
function filterPosts(searchTerm) {
    const filteredPosts = postsData.filter(post => post.productNumber.includes(searchTerm));
    renderPosts(filteredPosts);  // 필터링된 게시물만 렌더링
}

// Firestore에서 게시물 가져오기 (최신순으로 정렬)
async function loadPosts() {
    const postList = document.getElementById('postList');
    postList.innerHTML = '';  // 게시물 목록 초기화

    try {
        // 게시물 createdAt 기준으로 내림차순 정렬하여 가져오기
        const querySnapshot = await getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc')));
        postsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));  // 게시물 데이터를 배열에 저장
        renderPosts(postsData);  // 모든 게시물 초기 렌더링
    } catch (error) {
        console.error('게시물 불러오기 오류:', error);
    }
}

// 게시물 목록을 렌더링하는 함수
function renderPosts(posts) {
    const postList = document.getElementById('postList');
    postList.innerHTML = '';  // 기존 게시물 목록 초기화

    posts.forEach(postData => {
        const postElement = createPostElement(postData);
        postList.appendChild(postElement);
    });
}

// 게시물 요소 생성 함수
function createPostElement(postData) {
    const postDiv = document.createElement('div');
    postDiv.classList.add('post');

    const img = document.createElement('img');
    img.src = postData.thumbnail || postData.media[0].url;  // 썸네일이 있으면 썸네일 사용, 없으면 첫 번째 미디어 사용
    img.alt = postData.productNumber;

    // 게시물 클릭 시 상세 페이지로 이동
    postDiv.addEventListener('click', () => {
        window.location.href = `/detail.html?postId=${postData.id}`;
    });

    postDiv.appendChild(img);
    return postDiv;
}

// 로그아웃 처리
document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('userId');  // 세션에서 로그인 정보 제거
    window.location.href = '/login.html';  // 로그아웃 후 로그인 페이지로 이동
});

// 업로드 버튼 클릭 시 업로드 페이지로 이동
document.getElementById('uploadBtn').addEventListener('click', () => {
    window.location.href = '/upload.html';  // 업로드 페이지로 이동
});

// 회원가입 버튼 클릭 시 회원가입 페이지로 이동
document.getElementById('signupBtn').addEventListener('click', () => {
    window.location.href = '/register.html';  // 회원가입 페이지로 이동
});
