// --- ส่วนประตูหน้าบ้าน (ต้องมีเพื่อให้เปิดหน้าเว็บได้) ---
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index') // 'index' คือชื่อไฟล์ HTML ของคุณ
    .setTitle('ระบบบันทึกการตรวจสอบสายสื่อสาร')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// --- ส่วนบันทึกข้อมูล (ที่คุณแก้ไขไปล่าสุด) ---
const FOLDER_ID = "1ep7QF9qa5QyiT61_CeQEy2aD9z5RVflr";
const SHEET_ID = "1GufAXDQH5eOOS3CFQm1tCxhL6_wpHuYQOc1CRlOTp_0";

function processForm(data) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheets()[0];
    const rootFolder = DriveApp.getFolderById(FOLDER_ID);
    
    // 1. จัดการ Folder ตามชื่อ "ตำบล"
    const folderName = data.subdistrict; 
    let targetFolder;
    
    const folders = rootFolder.getFoldersByName(folderName);
    if (folders.hasNext()) {
      targetFolder = folders.next(); 
    } else {
      targetFolder = rootFolder.createFolder(folderName); 
    }
    
    // 2. จัดการรูปถ่ายและชื่อไฟล์
    let fileUrl = "ไม่มีรูปถ่าย";
    if (data.image && data.image.includes(",")) {
      const contentType = data.image.substring(5, data.image.indexOf(';'));
      const bytes = Utilities.base64Decode(data.image.split(',')[1]);
      
      const dateStr = Utilities.formatDate(new Date(), "GMT+7", "dd-MM-yyyy");
      const fileName = `${data.route}_เสาที่_${data.poleId} ${dateStr}.jpg`;
      
      const blob = Utilities.newBlob(bytes, contentType, fileName);
      const file = targetFolder.createFile(blob);
      fileUrl = file.getUrl();
    }

    // 3. บันทึกข้อมูลลง Google Sheets
    sheet.appendRow([
      new Date(), 
      data.subdistrict, 
      data.route, 
      data.poleId, 
      data.cableMainType, 
      data.cableSubType, 
      data.diameter, 
      data.quantity, 
      data.coreCount, 
      data.owner, 
      data.location, 
      data.recorder, 
      fileUrl
    ]);
    // เพิ่ม Event Listener สำหรับการเลือกไฟล์เพื่อโชว์ Preview ทันที
document.getElementById('fileInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');
      
      // ตั้งค่าขนาด Canvas (ใช้ขนาดเดียวกับที่จะส่งบันทึก)
      const maxWidth = 2000; 
      const scale = Math.min(maxWidth / img.width, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // --- วาด Time Stamp ให้เห็นใน Preview เลย ---
      const size = Math.round(canvas.width * 0.025);
      ctx.font = `bold ${size}px 'Sarabun'`;
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, canvas.height - (size * 4), canvas.width, size * 4);
      ctx.fillStyle = "white";
      
      const now = new Date().toLocaleString('th-TH');
      const loc = document.getElementById('location').value || "กำลังดึงพิกัด...";
      const route = document.getElementsByName('route')[0].value || "-";
      
      ctx.fillText(`📅 ${now}`, 30, canvas.height - (size * 2.8));
      ctx.fillText(`📍 ${loc}`, 30, canvas.height - (size * 1.8));
      ctx.fillText(`🛣️ ${route}`, 30, canvas.height - (size * 0.8));

      // แสดงภาพใน Element <img>
      const previewImg = document.getElementById('imagePreview');
      previewImg.src = canvas.toDataURL('image/jpeg', 0.7);
      document.getElementById('previewContainer').classList.remove('hidden');
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// อย่าลืมเพิ่มคำสั่งซ่อน Preview ในส่วน setTimeout ตอนบันทึกสำเร็จด้วยครับ
// document.getElementById('previewContainer').classList.add('hidden');
    
    return "Success";
  } catch (e) {
    return "Error: " + e.toString();
  }
}
