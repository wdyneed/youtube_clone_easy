const currentURL = new URL(window.location.href);

// URLSearchParams 객체 생성
const urlParams = new URLSearchParams(currentURL.search);

// video_id 쿼리 매개변수 가져오기
// 아래 videoID와 다르게 하기 위함
const video_ID = urlParams.get("id");

/** 비디오 리스트를 받아오는 함수 */
async function getVideoList() {
    let response = await fetch("https://oreumi.appspot.com/video/getVideoList");
    let videoListData = await response.json();
    return videoListData;
}

/** 비디오 id를 가지고 비디오에 대한 정보를 가져오는 함수 */
async function getVideoInfo(videoId) {
    let url = `https://oreumi.appspot.com/video/getVideoInfo?video_id=${videoId}`;
    let response = await fetch(url);
    let videoData = await response.json();
    return videoData;
}

//채널 캐시정보 담을 객체 선언
let channelCache = {};

/** 채널 정보를 가져오는 함수 */
async function getChannelInfo(channelName) {
    // 캐시에 채널 정보가 있는지 확인
    if (channelCache[channelName]) {
        return channelCache[channelName];
    }

    let url = `https://oreumi.appspot.com/channel/getChannelInfo`;

    let response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ video_channel: channelName }),
    });

    let channelData = await response.json();

    // 캐시에 채널 정보 저장
    channelCache[channelName] = channelData;

    return channelData;
}

/** 비디오 정보를 받아 section에 보여주는 함수 */
async function displayVideoSection(videoInfo) {
    let channelInfo = await getChannelInfo(videoInfo.video_channel);

    // 요소 선택
    let video_player = document.getElementById("video-player");
    let video_desc = document.getElementById("video-desc");
    let channelURL = `channel.html?channel_name=${channelInfo.channel_name}`;

    // 화면에 데이터 표시
    const videoplayerHTML = `
        <div id="main-video">
            <video src="${videoInfo.video_link}" autoplay muted controls></video>
        </div>
        <h1 id="video-main-title">${videoInfo.video_title}</h1>
        <div id="video-info">
            <div id="video-views-date"> <!-- 임시로 추가 -->
                <span id="video-views">${formatViews(videoInfo.views)}</span>
                <span id="video-upload-date">${formatDate(videoInfo.upload_date)}</span>
            </div>
            <div id="reaction">
                <div>
                    <img class="video-reaction-btn" src="../src/img_video/Liked.svg">
                    <span class="video-reaction-text">1.7K</span>
                </div>
                <div>
                    <img class="video-reaction-btn" src="../src/img_video/DisLiked.svg">
                    <span class="video-reaction-text">632</span>
                </div>
                <div>
                    <img class="video-reaction-btn" src="../src/img_video/Share.svg">
                    <span class="video-reaction-text">SHARE</span>
                </div>
                <div>
                    <img class="video-reaction-btn" src="../src/img_video/Save.svg">
                    <span class="video-reaction-text">SAVE</span>
                </div>
                <div>
                    <img class="video-reaction-btn" src="../src/img_video/More.svg">
                </div>
            </div>
        </div>
        <hr>
    `;

    const videoDescHTML = `
        <div id="video-channel-title">
            <img id="video-main-profile" src="${channelInfo.channel_profile}" onclick="navigateToChannel('${channelURL}')">
            <div id="video-info-text">
                <span id="video-main-channel-name" onclick="navigateToChannel('${channelURL}')">${channelInfo.channel_name}</span><br>
                <span id="video-subscriber">${formatsubscribers(channelInfo.subscribers)}</span>
            </div>
            <div>
                <button id="subscribe-btn">SUBSCRIBES</button>
            </div>
        </div>
        <p id="video-desc-text">
            ${videoInfo.video_detail}
        </p>
        <span id="video-show-more">SHOW MORE</span>
        <hr>
    `;

    video_player.innerHTML += videoplayerHTML;
    video_desc.innerHTML += videoDescHTML;

    const subscribeBtn = document.getElementById("subscribe-btn");
    subscribeBtn.addEventListener("click", function () {

      if (subscribeBtn.textContent === "SUBSCRIBES") {
        subscribeBtn.textContent = "SUBSCRIBED";
        subscribeBtn.style.backgroundColor = "white";
        subscribeBtn.style.color = "black";
      }
      else {
        subscribeBtn.textContent = "SUBSCRIBES";
        subscribeBtn.style.backgroundColor = "#C00";
        subscribeBtn.style.color = "#FFF";
      }
      
  });
}

/** 비디오 리스트를 받아 aside에 보여주는 함수 */
async function displayVideoAside(videoList) {
    let video_aside_section = document.getElementById("video-aside-section");
    let videoAsideItems = "";

    // 비디오 리스트를 돌면서 각각의 id로 비디오 정보를 받아옴
    let videoInfoPromises = videoList.map((video) => getVideoInfo(video.video_id));
    let videoInfoList = await Promise.all(videoInfoPromises);

    for (let i = 0; i < videoList.length; i++) {
        let videoInfo = videoInfoList[i];
        let videoURL = `video.html?id=${videoInfo.video_id}`;

        videoAsideItems += `
        <div class="video-aside-container" onclick="navigateToVideo('${videoURL}')">
            <div>
                <image class="video-aside-thumbnail" src="${videoInfo.image_link}"></image>
                <span class="video-aside-time">0:09</span>
            </div>
            <div>
                <span class="video-aside-title">${videoInfo.video_title}</span>
                <span class="video-aside-channel-name">${videoInfo.video_channel}</span>
                <span class="video-aside-sub-info">${formatViews(videoInfo.views)}. ${formatDate(
            videoInfo.upload_date
        )}</span>
            </div>
        </div>
        `;
    }

    // 화면에 추가
    video_aside_section.innerHTML = videoAsideItems;
}

/** 채널 필터링된 비디오 리스트를 받아 aside에 보여주는 함수 */
function displayFilteredVideoAside() {
    let aside_menu = document.querySelectorAll("#video-aside-menu > li");

    aside_menu.forEach((item) => {
        item.addEventListener("click", function () {
            // active 상태 삭제
            aside_menu.forEach((menuItem) => {
                menuItem.classList.remove("active");
            });

            item.classList.add("active");
            let text_content = item.getElementsByTagName("a")[0].textContent;
            let channelname = text_content.replace("From ", "");

            getVideoList().then((videoList) => {
                let filteredVideoList;
                if (text_content === "All") {
                    filteredVideoList = videoList;
                } else {
                    filteredVideoList = videoList.filter(
                        (video) => video.video_channel === channelname
                    );
                }
                displayVideoAside(filteredVideoList);
            });
        });
    });
}

/** video html로 바로가기 위한 함수 */
function navigateToVideo(videoURL) {
    window.location.href = videoURL;
}

/** channel html로 바로가기 위한 함수 */
function navigateToChannel(channelURL) {
    window.location.href = channelURL;
}

// home으로 바로가기 위한 함수
function navigateToHome() {
    window.location.href = `index.html`;
}

/** 날짜 포맷 정하는 함수 Oct 8, 2021 -> 24개월 전 */
function formatDate(dateStr) {
    // 입력된 날짜 문자열을 파싱하여 Date 객체를 생성
    function parseDate(dateStr) {
        const parts = dateStr.split("/");
        // parts[0]은 년도, parts[1]은 월, parts[2]는 일
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }

    /** 두 날짜간 차이 계산 */
    function calculateDifference(currentDate, pastDate) {
        const diffMilliseconds = currentDate - pastDate;
        const diffSeconds = diffMilliseconds / 1000;
        const diffMinutes = diffSeconds / 60;
        const diffHours = diffMinutes / 60;
        const diffDays = diffHours / 24;
        const diffWeeks = diffDays / 7;
        const diffMonths = diffDays / 30.44; // 평균적으로 한 달은 30.44일로 계산

        if (diffMonths >= 1) {
            return Math.round(diffMonths) + "개월 전";
        } else if (diffWeeks >= 1) {
            return Math.round(diffWeeks) + "주 전";
        } else if (diffDays >= 1) {
            return Math.round(diffDays) + "일 전";
        } else if (diffHours >= 1) {
            return Math.round(diffHours) + "시간 전";
        } else {
            return Math.round(diffMinutes) + "분 전";
        }
    }

    const pastDate = parseDate(dateStr);
    const currentDate = new Date();
    return calculateDifference(currentDate, pastDate);
}

/** 조회수 형식을 정하는 함수 */
function formatViews(views) {
    // 1만 이상
    if (views >= 10000) {
        return `조회수 ${Math.round(views / 10000)}만회`;
    }
    // 1천 이상
    else if (views.length >= 4) {
        return `조회수 ${Math.round(views)}천회`;
    }
    // 1천 미만
    else {
        return `조회수 ${views}회`;
    }
}

function formatsubscribers(subscribersnum) {
    if (subscribersnum >= 10000) {
      return `구독자 ${Math.round(subscribersnum / 10000)}만명`
    }
    else{
      return `구독자 ${subscribersnum}명`
    }
  }

// 화면 로딩이 완료된 후 실행
window.onload = function () {
    getVideoInfo(video_ID).then(displayVideoSection);
    getVideoList().then(displayVideoAside);
    getVideoList().then(displayFilteredVideoAside);

    // 유튜브 로고 클릭 시 홈 이동
    let youtube_logo = document.getElementById("youtube-logo");
    youtube_logo.addEventListener("click", function () {
        navigateToHome();
    });
};
