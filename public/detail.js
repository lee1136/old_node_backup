import { db } from "./firebase.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// 뒤로 가기 버튼 클릭 시 대시보드로 이동
document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = '/dashboard.html';  // 홈(dashboard.html)으로 이동
});

// 우클릭(컨텍스트 메뉴) 비활성화
document.addEventListener('contextmenu', function (e) {
    if (e.target.tagName === 'IMG') {  // 이미지만 우클릭 방지
        e.preventDefault();  // 우클릭 방지
    }
});

// PrintScreen, Ctrl+S, Ctrl+P 등의 단축키 방지
document.addEventListener('keydown', function (e) {
    // PrintScreen 방지
    if (e.key === 'PrintScreen') {
        alert("캡처는 허용되지 않습니다!");
        e.preventDefault();
    }
    
    // Ctrl+S (저장 방지)
    if ((e.ctrlKey && e.key === 's') || (e.ctrlKey && e.key === 'S')) {
        alert("페이지 저장이 허용되지 않습니다.");
        e.preventDefault();
    }

    // Ctrl+P (인쇄 방지)
    if ((e.ctrlKey && e.key === 'p') || (e.ctrlKey && e.key === 'P')) {
        alert("페이지 인쇄가 허용되지 않습니다.");
        e.preventDefault();
    }
});

// 수정하기 버튼 클릭 시 수정 페이지로 이동
document.getElementById('editBtn').addEventListener('click', () => {
    window.location.href = `/edit.html?postId=${postId}`; // 수정 페이지로 이동, postId를 쿼리 파라미터로 전달
});

// 게시물 ID 가져오기
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const postId = urlParams.get('postId');  // postId 파라미터 가져오기

// 게시물 상세 정보 불러오기
async function loadPostDetail() {
    const postDetail = document.getElementById('postDetail');

    try {
        const docRef = doc(db, 'posts', postId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const postData = docSnap.data();
            const companyName = postData.companyName ? postData.companyName + " " : ''; // 회사명이 있으면 추가

            // 품번 및 회사명 표시
            document.getElementById('productNumber').innerText = `No. ${companyName}${postData.productNumber}`;

            // 사이즈가 없을 때 공백으로 처리
            const sizeText = postData.size ? postData.size : "";  // 사이즈가 없으면 빈 문자열 처리

            // 상세 정보 표시 (비디오 무한 반복 및 자동 재생)
            postDetail.innerHTML = `
                <video src="${postData.media[0].url}" class="post-video" autoplay loop muted></video> <!-- 재생바 제거 -->
                <div class="image-gallery">
                    ${postData.media.slice(1).map(media => `<img src="${media.url}" alt="${media.fileName}" class="gallery-image">`).join('')}
                </div>
                <div class="post-info">
                    <h2>${companyName}${postData.productNumber}</h2>
                    <p>종류: ${postData.type}</p>
                    <p>중량: ${postData.weight}</p>
                    <p>사이즈: ${sizeText}</p> <!-- 사이즈가 없으면 공백 처리 -->
                    <p>추가 내용: ${postData.additionalContent}</p>
                </div>
            `;

            // 세션에서 사용자 ID 가져오기
            const userId = sessionStorage.getItem('userId');
            if (userId) {
                const userRef = doc(db, "users", userId);
                const userSnap = await getDoc(userRef);
                
                if (userSnap.exists()) {
                    const userRole = userSnap.data().role;
                    if (userRole === 'admin') {
                        document.getElementById('editBtn').style.display = 'block'; // 관리자에게만 수정하기 버튼 표시
                    }
                } else {
                    console.error('사용자 정보를 찾을 수 없습니다.');
                }
            } else {
                console.error('로그인된 사용자 정보가 없습니다.');
            }

            // 이미지 클릭 시 모달 열기 (이미지 저장 방지는 유지, 클릭은 가능하게)
            document.querySelectorAll('.gallery-image').forEach(image => {
                image.style.pointerEvents = 'auto';  // 이미지 클릭 가능하게 설정
                image.addEventListener('click', () => {
                    openModal(image.src, `${companyName}${postData.productNumber}`);
                });
            });
        } else {
            postDetail.innerHTML = '<p>게시물을 찾을 수 없습니다.</p>';
        }
    } catch (error) {
        console.error('게시물 불러오기 오류:', error);
        postDetail.innerHTML = '<p>게시물 정보를 불러오는 데 오류가 발생했습니다.</p>';
    }
}

// 모달 열기
function openModal(imageSrc, productNumber) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const captionText = document.getElementById('caption');
    
    modal.style.display = "block"; // 모달 표시
    modalImage.src = imageSrc; // 모달 안의 이미지 소스 설정
    captionText.innerHTML = productNumber; // 캡션 설정

    // 모달 창 바깥쪽을 클릭하면 모달 닫기
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });
}

// 모달 닫기 (X 버튼 클릭 시)
document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('imageModal').style.display = "none"; // 모달 숨기기
});

// 페이지 로드 시 게시물 상세 정보 불러오기
document.addEventListener('DOMContentLoaded', loadPostDetail);
