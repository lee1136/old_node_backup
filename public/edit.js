import { db, storage } from "./firebase.js";  // auth 제거
import { getDoc, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

let existingMedia = [];  // 기존 미디어를 저장할 배열
let selectedThumbnail = null;  // 선택된 썸네일

// 뒤로 가기 버튼 클릭 시 대시보드로 이동
document.getElementById('backBtn').addEventListener('click', () => {
    window.history.back();  // 이전 페이지로 이동
});

// 게시물 ID 가져오기
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const postId = urlParams.get('postId');  // postId 파라미터 가져오기

// 게시물 상세 정보 불러오기
async function loadPostDetail() {
    try {
        const docRef = doc(db, 'posts', postId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const postData = docSnap.data();
            // 폼 필드에 값 설정
            document.getElementById('productNumber').value = postData.productNumber;
            document.getElementById('type').value = postData.type;
            document.getElementById('size').value = postData.size.split(' ')[0];
            document.getElementById('sizeUnit').value = postData.size.split(' ')[1];
            document.getElementById('weight').value = postData.weight.replace('g', '');
            document.getElementById('additionalContent').value = postData.additionalContent;

            // 기존 미디어 미리보기
            existingMedia = postData.media || [];
            displayMediaPreview(existingMedia);
        } else {
            alert('게시물을 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('게시물 불러오기 오류:', error);
    }
}

// 미디어 미리보기 표시 함수
function displayMediaPreview(mediaFiles) {
    const mediaPreview = document.getElementById('mediaPreview');
    mediaPreview.innerHTML = '';  // 기존 미디어 초기화

    mediaFiles.forEach((media, index) => {
        const mediaElement = document.createElement(media.type.includes('video') ? 'video' : 'img');
        mediaElement.src = media.url;
        mediaElement.controls = media.type.includes('video');  // 동영상이면 컨트롤 추가
        mediaElement.classList.add('media-item');
        mediaElement.addEventListener('click', () => {
            selectedThumbnail = media;  // 썸네일 선택
        });

        // 미디어 삭제 버튼
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '삭제';
        deleteBtn.classList.add('delete-btn');
        deleteBtn.addEventListener('click', () => {
            deleteMediaFile(media, index);
        });

        const mediaContainer = document.createElement('div');
        mediaContainer.appendChild(mediaElement);
        mediaContainer.appendChild(deleteBtn);
        mediaPreview.appendChild(mediaContainer);
    });
}

// 미디어 파일 삭제
function deleteMediaFile(media, index) {
    const confirmDelete = confirm('이 미디어 파일을 삭제하시겠습니까?');
    if (confirmDelete) {
        const mediaRef = ref(storage, media.url);  // Firebase Storage 참조

        // Firebase Storage에서 삭제
        deleteObject(mediaRef).then(() => {
            existingMedia.splice(index, 1);  // 배열에서 미디어 제거
            displayMediaPreview(existingMedia);  // 미리보기 갱신
            alert('미디어 파일이 삭제되었습니다. 계속 수정할 수 있습니다.');
        }).catch((error) => {
            console.error('미디어 파일 삭제 중 오류:', error);
        });
    }
}

// 새 파일을 업로드할 때 실시간 미리보기 추가
document.getElementById('fileInput').addEventListener('change', (event) => {
    const files = event.target.files;
    const mediaPreview = document.getElementById('mediaPreview');

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const newMediaElement = document.createElement(file.type.includes('video') ? 'video' : 'img');
            newMediaElement.src = e.target.result;
            newMediaElement.controls = file.type.includes('video');
            newMediaElement.classList.add('media-item');
            mediaPreview.appendChild(newMediaElement);
        };
        reader.readAsDataURL(file);
    });
});

// 게시물 삭제 버튼 클릭 시 게시물 삭제
document.getElementById('deleteBtn').addEventListener('click', async () => {
    const confirmDelete = confirm('정말로 이 게시물을 삭제하시겠습니까?');
    if (confirmDelete) {
        try {
            // Firestore에서 게시물 삭제
            await deleteDoc(doc(db, 'posts', postId));

            // Firebase Storage에서 관련 미디어 삭제
            const deletePromises = existingMedia.map(media => {
                const storageRef = ref(storage, 'uploads/' + media.fileName);
                return deleteObject(storageRef);
            });

            await Promise.all(deletePromises);
            alert('게시물이 삭제되었습니다.');
            window.location.href = '/dashboard.html';  // 삭제 후 대시보드로 이동
        } catch (error) {
            console.error('게시물 삭제 중 오류:', error);
        }
    }
});

// 수정 완료 버튼 클릭 시 수정된 데이터 저장
document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const productNumber = document.getElementById('productNumber').value;
    const type = document.getElementById('type').value;
    const size = `${document.getElementById('size').value} ${document.getElementById('sizeUnit').value}`;
    const weight = `${document.getElementById('weight').value}g`;
    const additionalContent = document.getElementById('additionalContent').value;
    const files = document.getElementById('fileInput').files;
    const uploadPromises = [];

    // 파일 업로드가 있는 경우에만 처리
    if (files.length > 0) {
        Array.from(files).forEach(file => {
            const storageRef = ref(storage, 'uploads/' + file.name);
            const uploadTask = uploadBytes(storageRef, file).then(snapshot => {
                return getDownloadURL(snapshot.ref).then(downloadURL => {
                    return { fileName: file.name, url: downloadURL, type: file.type };
                });
            });
            uploadPromises.push(uploadTask);
        });

        const newMediaFiles = await Promise.all(uploadPromises);
        existingMedia = [...existingMedia, ...newMediaFiles];  // 기존 미디어에 새 미디어 추가
    }

    const thumbnailURL = selectedThumbnail?.url || existingMedia[0]?.url;

    // Firestore에 수정된 데이터 저장
    setDoc(doc(db, "posts", postId), {
        productNumber,
        type,
        size,
        weight,
        additionalContent,
        media: existingMedia,
        thumbnail: thumbnailURL,  // 썸네일 업데이트
    }).then(() => {
        alert('게시물이 수정되었습니다.');
        window.location.href = '/detail.html?postId=' + postId;  // 수정 완료 후 상세 페이지로 이동
    }).catch(error => {
        console.error("게시물 수정 중 오류:", error);
    });
});

// 페이지 로드 시 게시물 상세 정보 불러오기
document.addEventListener('DOMContentLoaded', loadPostDetail);
