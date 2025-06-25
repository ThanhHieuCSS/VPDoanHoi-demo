const qrCodeRegionId = "reader";
const sheetURL = "https://script.google.com/macros/s/AKfycbzOem6XyhjVA1XwjnRO3LyrubS-DRK7aQoQ38xJvYHgOxMOQhAuxY3jeBCjaWLS3xkztQ/exec";
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
  document.getElementById("startBtn").style.display = "none";
  document.getElementById("stopBtn").style.display = "inline-block";

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

function stopScanner() {
  html5QrCode.stop().then(() => {
    document.getElementById("reader").style.display = "none";
    document.getElementById("startBtn").style.display = "inline-block";
    document.getElementById("stopBtn").style.display = "none";
  }).catch(err => {
    console.error("Lỗi khi dừng camera:", err);
  });
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





//-------------- hàm vị trí chữ gõ -------------------
// Mảng chứa các từ sẽ hiển thị luân phiên
const texts = ["STU","Trường Đại Học Công Nghệ Sài Gòn"];

let textIndex = 0; // Vị trí của từ hiện tại trong mảng texts
let charIndex = 0; // Vị trí ký tự hiện tại trong từ
let isDeleting = false; // Biến kiểm tra trạng thái xóa chữ (true: đang xóa, false: đang gõ)

// Hàm hiệu ứng gõ chữ
function typeEffect() {
    const typingElement = document.getElementById("typing"); // Lấy phần tử có ID "typing"
    const currentText = texts[textIndex]; // Lấy từ hiện tại trong mảng texts

    if (isDeleting) {
        charIndex--; // Nếu đang xóa, giảm số ký tự hiển thị
    } else {
        charIndex++; // Nếu đang gõ, tăng số ký tự hiển thị
    }

    // Hiển thị một phần của chữ theo charIndex
    typingElement.innerHTML = currentText.substring(0, charIndex);

    // Kiểm tra nếu đã gõ xong toàn bộ chữ
    if (!isDeleting && charIndex === currentText.length) {
        isDeleting = true; // Bắt đầu chuyển sang trạng thái xóa chữ
        setTimeout(typeEffect, 1500); // Giữ chữ trong 1.5 giây trước khi xóa
        return; // Dừng hàm tạm thời
    }
    
    // Kiểm tra nếu đã xóa hết chữ
    else if (isDeleting && charIndex === 0) {
        isDeleting = false; // Quay lại trạng thái gõ chữ
        textIndex = (textIndex + 1) % texts.length; // Chuyển sang từ tiếp theo
    }

    // Điều chỉnh tốc độ gõ/xóa chữ
    let speed = isDeleting ? 50 : 100; // Khi xóa nhanh hơn khi gõ
    setTimeout(typeEffect, speed); // Gọi lại hàm sau khoảng thời gian tương ứng
}

// Gọi hàm để bắt đầu hiệu ứng
typeEffect();



document.addEventListener("DOMContentLoaded", function () {
    const timelineItems = document.querySelectorAll(".timeline-item");

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
            }
        });
    }, { threshold: 0.5 });

    timelineItems.forEach(item => observer.observe(item));
});
//------------------