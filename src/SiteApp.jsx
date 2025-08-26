// src/SiteApp.jsx
export default function SiteApp() {
  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
      <h1>โล๊ะ DVD มือสอง</h1>
      <p>
        ชำระเงินแล้วไป <a href="#/transfer">หน้าแจ้งโอน</a> เพื่อแนบสลิปได้เลย
      </p>
      <div style={{ border: "1px solid #eee", padding: 16, borderRadius: 12 }}>
        <b>บัญชีสำหรับโอน</b>
        <div>ธนาคาร: กรุงเทพ</div>
        <div>เลขบัญชี: 047-007-8908</div>
        <div>ชื่อบัญชี: อาทิตย์ เลิศรักษ์มงคล</div>
        <div>ค่าส่ง: 50 บาท (เหมาจ่าย)</div>
      </div>
    </div>
  );
}
