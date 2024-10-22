import { db } from "./firebase.js";
import { setDoc, doc, getDocs, collection, updateDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// 사용자 목록을 로드하고 화면에 표시하는 함수
async function loadAllUsers() {
    const allUsersInfoDiv = document.getElementById('allUsersInfo');

    if (!allUsersInfoDiv) {
        console.error('allUsersInfo 요소를 찾을 수 없습니다.');
        return;
    }

    try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        let userInfoHTML = '<h3>회원 목록</h3>';

        // 사용자를 가입일 기준 내림차순으로 정렬 (최근 가입한 사용자가 위에 표시)
        const users = querySnapshot.docs.sort((a, b) => {
            const dateA = a.data().createdAt;
            const dateB = b.data().createdAt;
            return dateB.seconds - dateA.seconds;  // 최신 순으로 정렬
        });

         // 사용자 목록을 No.1이 가장 아래로 가도록 최신 가입자부터 나열
        users.forEach((doc, index) => {
            const userData = doc.data();
            const userNo = users.length - index;  // userNo를 계산하여 최신 사용자가 위로 정렬

            userInfoHTML += `
                <div>
                    <p>No.${userNo} - 아이디: ${userData.userId}</p>
                    <p>비밀번호: ${userData.password}</p>
                    <select class="role-select" id="role-${doc.id}">
                        <option value="member" ${userData.role === 'member' ? 'selected' : ''}>일반회원</option>
                        <option value="admin" ${userData.role === 'admin' ? 'selected' : ''}>관리자</option>
                    </select>
                    <button class="updateRoleBtn" data-user-id="${doc.id}">수정</button>
                    <button class="deleteUserBtn" data-user-id="${doc.id}" data-email="${userData.userId}">탈퇴</button>
                </div>
            `;
        });

        allUsersInfoDiv.innerHTML = userInfoHTML;
        
        // 역할 수정 버튼 클릭 이벤트
        document.querySelectorAll('.updateRoleBtn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const userId = e.target.getAttribute('data-user-id');
                const newRole = document.getElementById(`role-${userId}`).value;

                try {
                    await updateDoc(doc(db, 'users', userId), {
                        role: newRole
                    });
                    alert('역할이 성공적으로 수정되었습니다.');
                } catch (error) {
                    console.error('역할 수정 오류:', error);
                    alert('역할 수정 중 오류가 발생했습니다.');
                }
            });
        });

        // 탈퇴 버튼 클릭 이벤트
        document.querySelectorAll('.deleteUserBtn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const userId = e.target.getAttribute('data-user-id');
                const confirmDelete = confirm('정말로 이 회원을 탈퇴시키겠습니까?');

                if (confirmDelete) {
                    try {
                        // Firestore에서 사용자 정보 삭제
                        await deleteDoc(doc(db, 'users', userId));
                        alert('회원이 성공적으로 탈퇴되었습니다.');
                        loadAllUsers();  // 삭제 후 사용자 목록 갱신
                    } catch (error) {
                        console.error('회원 탈퇴 중 오류:', error);
                        alert('회원 탈퇴 중 오류가 발생했습니다.');
                    }
                }
            });
        });

    } catch (error) {
        console.error('회원 정보 불러오기 오류:', error);
        allUsersInfoDiv.innerHTML = '<p>회원 정보를 불러오는 중 오류가 발생했습니다.</p>';
    }
}

// 회원가입 처리 및 중복 아이디 확인
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userId = document.getElementById('userId').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        // 중복 아이디 확인
        const userDocRef = doc(db, 'users', userId);
        const userSnapshot = await getDoc(userDocRef);

        if (userSnapshot.exists()) {
            alert('이미 존재하는 아이디입니다.');
            return;
        }

        try {
            // Firestore에 사용자 정보 저장
            await setDoc(doc(db, 'users', userId), {
                email: userId,
                password: password,
                role: role,
                createdAt: new Date() // 가입일 추가
            });

            alert('회원가입이 완료되었습니다.');
            loadAllUsers();  // 회원 목록 갱신
        } catch (error) {
            console.error('회원가입 오류:', error);
            alert('회원가입 실패: ' + error.message);
        }
    });
}

// 로그인 처리
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userId = document.getElementById('userId').value;
        const password = document.getElementById('password').value;

        try {
            // Firestore에서 사용자 정보 확인
            const docRef = doc(db, 'users', userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const userData = docSnap.data();
                if (userData.password === password) {
                    // 로그인 성공
                    sessionStorage.setItem('userId', userId);  // 세션에 로그인 정보 저장
                    window.location.href = '/dashboard.html';  // 로그인 후 대시보드로 이동
                } else {
                    alert('비밀번호가 잘못되었습니다.');
                }
            } else {
                alert('사용자를 찾을 수 없습니다.');
            }
        } catch (error) {
            console.error('로그인 오류:', error);
            alert('로그인 실패: ' + error.message);
        }
    });
}

// 로그아웃 처리
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('userId');  // 세션에서 로그인 정보 제거
        window.location.href = '/login.html';  // 로그아웃 후 로그인 페이지로 이동
    });
}

// 페이지가 로드되면 모든 회원 정보를 가져옴 (관리자용 페이지일 때)
document.addEventListener('DOMContentLoaded', async () => {
    if (document.getElementById('allUsersInfo')) {
        loadAllUsers();  // 사용자 목록 로드
    }
});
