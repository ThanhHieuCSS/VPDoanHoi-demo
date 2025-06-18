const qrCodeRegionId = "reader";
const sheetURL = "https://script.google.com/macros/s/AKfycbx04-GtmrMIZAZI2E3g5i26F6x2yla5HW9SStqLavz_8rAUP6nuAgB08F42o792xE65MQ/exec";
const beepSound = document.getElementById("beep");
const readerEl = document.getElementById("reader");


let lastScannedText = "";
let lastScannedTime = 0;
const dedupCooldown = 2500; // 5 giây: không quét lại cùng mã

let html5QrCode;
let isCooldown = false;        // ⏱ Dừng 1s giữa các lần quét
let queue = [];
let isSending = false;

function onScanSuccess(decodedText) {

  const now = Date.now();

  // ❌ Bỏ qua nếu mã trùng trong thời gian gần đây
  if (decodedText === lastScannedText && (now - lastScannedTime < dedupCooldown)) {
    console.log("⛔ Trùng mã, bỏ qua:", decodedText);
    return;
  }

  // ✅ Cập nhật mã gần nhất
  lastScannedText = decodedText;
  lastScannedTime = now;

  if (isCooldown) return;

  isCooldown = true; // ⛔ Tạm dừng quét tiếp
  setTimeout(() => {
    isCooldown = false; // ✅ Sau 1s mới quét lại được
  }, 1000);



  // 🔊 Bíp + viền
  beepSound.play();
  readerEl.classList.add("qr-highlight");
  setTimeout(() => readerEl.classList.remove("qr-highlight"), 800);

  // 📌 Hiển thị nội dung
  document.getElementById("qrText").innerText = decodedText;
  document.getElementById("status").innerText = "📤 Đang gửi dữ liệu...";

  // 🧠 Đưa vào hàng đợi
  queue.push(decodedText);
  saveQueue();
  processQueue();
}

function saveQueue() {
  localStorage.setItem("qrQueue", JSON.stringify(queue));
}

function processQueue() {
  if (isSending || queue.length === 0) return;

  isSending = true;
  const data = queue[0];

  fetch(sheetURL, {
    method: "POST",
    body: new URLSearchParams({ data: data })
  })
    .then((res) => res.text())
    .then((result) => {
      document.getElementById("status").innerText = "✅ Đã gửi: " + data;
      queue.shift();
      saveQueue();
      isSending = false;
      processQueue(); // Tiếp tục gửi nếu còn
    })
    .catch((err) => {
      console.error("❌ Lỗi gửi:", err);
      document.getElementById("status").innerText = "❌ Gửi lỗi, sẽ thử lại...";
      isSending = false;
      setTimeout(processQueue, 2000); // Thử lại sau 2s
    });
}

function startScanner() {
  document.getElementById("reader").style.display = "block";

  html5QrCode = new Html5Qrcode(qrCodeRegionId);
  html5QrCode.start(
    { facingMode: "environment" },
    {
      fps: 20,
      qrbox: function (viewfinderWidth, viewfinderHeight) {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const size = minEdge * 0.75;
        return { width: size, height: size };
      }
    },
    onScanSuccess
  );
}

// 🔄 Tải lại hàng đợi nếu có
window.addEventListener("load", () => {
  try {
    const saved = JSON.parse(localStorage.getItem("qrQueue") || "[]");
    if (saved.length > 0) {
      queue.push(...saved);
      processQueue();
    }
  } catch (e) {
    console.warn("Không thể load queue:", e);
  }
});
