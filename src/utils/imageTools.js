export const NO_IMAGE = "/no-image.svg";

/**
 * รับค่า cover เป็น:
 *  - http/https -> ส่งคืนตามเดิม
 *  - "unleash-3.jpg" หรือ "covers/unleash-3.jpg" -> แมพไป /covers/xxx
 * หมายเหตุ: ไฟล์ในโฟลเดอร์ public จะเสิร์ฟที่ราก / (ไม่ต้องมีคำว่า public)
 */
export function toImageURL(cover){
  if(!cover) return NO_IMAGE;
  if(/^https?:\/\//i.test(cover)) return cover;

  let c = String(cover)
    .replace(/^public\//i,"")
    .replace(/^src\//i,"")
    .replace(/^\//,"");

  if(!/^covers\//i.test(c)) c = "covers/"+c;
  return "/"+c;
}
