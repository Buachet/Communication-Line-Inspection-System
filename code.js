/**
 * บันทึกผลการตรวจสอบสายสื่อสาร
 * พัฒนาโดย: PEA บัวเชด
 */

const FOLDER_ID = "1ep7QF9qa5QyiT61_CeQEy2aD9z5RVflr"; 
const SHEET_ID = "1zWwyj5PC5ao9HjbQ4cTy-2GtXOY-ABbOF5Jh7tX5Aps"; 

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('ระบบจัดเก็บข้อมูลสายสื่อสาร')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function processForm(data) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheets()[0];
    const rootFolder = DriveApp.getFolderById(FOLDER_ID);
    
    let targetFolder;
    const folders = rootFolder.getFoldersByName(data.subdistrict);
    targetFolder = folders.hasNext() ? folders.next() : rootFolder.createFolder(data.subdistrict);
    
    // ฟังก์ชันบันทึกรูปภาพพร้อมตั้งชื่อใหม่ตามโจทย์
    const saveImg = (base64, photoNumber) => {
      if (!base64 || base64.length < 100) return "ไม่มีรูป";
      
      const dateStr = Utilities.formatDate(new Date(), "GMT+7", "dd-MM-yyyy");
      // รูปแบบชื่อไฟล์: data.route_เสาที่data.poleId_วันที่_รูปที่ 1 หรือ 2
      const fileName = `${data.route}_เสาที่${data.poleId}_${dateStr}_รูปที่ ${photoNumber}.jpg`;
      
      const bytes = Utilities.base64Decode(base64.split(',')[1]);
      const blob = Utilities.newBlob(bytes, "image/jpeg", fileName);
      const file = targetFolder.createFile(blob);
      
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return file.getUrl();
    };

    const url1 = saveImg(data.image1, "1");
    const url2 = saveImg(data.image2, "2");

    // แยก Lat/Long
    let lat = "", lng = "";
    if (data.location && data.location.includes(",")) {
      lat = data.location.split(",")[0].trim();
      lng = data.location.split(",")[1].trim();
    }

    // บันทึกลง Sheet
    sheet.appendRow([
      new Date(), 
      data.subdistrict, 
      data.route, 
      data.poleId, 
      data.owner,
      data.cableMainType, 
      data.cableSubType, 
      data.diameter, 
      data.quantity, 
      data.coreCount,
      data.location, 
      lat, 
      lng, 
      data.recorder, 
      url1, 
      url2
    ]);
    
    return "Success";
  } catch (e) {
    return "Error: " + e.toString();
  }
}
