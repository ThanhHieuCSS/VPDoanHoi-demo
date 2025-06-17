const qrCodeRegionId = "reader";
const sheetURL = "https://script.google.com/macros/s/AKfycbx04-GtmrMIZAZI2E3g5i26F6x2yla5HW9SStqLavz_8rAUP6nuAgB08F42o792xE65MQ/exec";
const beepSound = document.getElementById("beep");
const readerEl = document.getElementById("reader");

let html5QrCode;// Biến toàn cục để lưu trữ đối tượng Html5Qrcode tránh để bên trong hàm srtScanner() thành biến cục bộ, dùng lại khi cần thiết


function onScanSuccess(decodedText, decodedResult) {
  document.getElementById("qrText").innerText = decodedText;
  document.getElementById("status").innerText = "📤 Đang gửi dữ liệu...";
  
    // 🔊 Phát tiếng bíp
    beepSound.play();

    // Hiện viền đỏ
    readerEl.classList.add("qr-highlight");

      // 🛑 Dừng quét ngay
    html5QrCode.pause();

  fetch(sheetURL, {
    method: "POST",
    body: new URLSearchParams({ data: decodedText })
  })
  .then(res => res.text())
  .then(result => {
    document.getElementById("status").innerText = "✅ Đã gửi: " + decodedText;

    // 🕒 Tạm dừng quét trong 1 giây
    setTimeout(() => {
      readerEl.classList.remove("qr-highlight");
      html5QrCode.resume();
      document.getElementById("status").innerText = "⏳ Đang chờ quét...";
    }, 100);
  })
  .catch(error => {
    document.getElementById("status").innerText = "❌ Lỗi gửi dữ liệu!";
    console.error("Lỗi:", error);
  });
}



function startScanner(){
  document.getElementById("reader").style.display = "block"; //lấy phần tử có id là reader thay đổi thuộc tính display thành block

  html5QrCode = new Html5Qrcode(qrCodeRegionId); // bỏ "const" html5QrCode = new Html5Qrcode(qrCodeRegionId); nếu muốn sử dụng biến toàn cục
html5QrCode.start(
  { facingMode: "environment" },
  { fps: 20,
    //qrbox: { width: 300, height: 200 }//khung quét QR
    qrbox: function(viewfinderWidth, viewfinderHeight) {
      const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
      const size = minEdge * 0.75;
      return { width: size, height: size };
    }
    
  },
  onScanSuccess
);
}



