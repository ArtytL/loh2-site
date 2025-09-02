// src/App.jsx
import React from "react";

export default function App() {
  const [view, setView] = React.useState(<div style={{padding:20}}>กำลังโหลด…</div>);

  React.useEffect(() => {
    import("./RealApp.jsx")
      .then(m => setView(<m.default />))
      .catch(err => {
        setView(
          <div style="padding:20;color:#b00020;white-space:pre-wrap">
            <h2>โหลดแอปไม่สำเร็จ</h2>
            {String(err && (err.message || err))}

            <div style="margin-top:12px;color:#222">
              ตรวจว่าไฟล์/พาธที่ import อยู่จริงและสะกดตรง:
              <ul>
                <li>src/lib/cart.js</li>
                <li>src/utils/imageTools.js</li>
                <li>หน้าเพจที่ import ทั้งหมด</li>
              </ul>
            </div>
          </div>
        );
        // แสดง stack เพิ่มเติมในคอนโซล
        console.error(err);
      });
  }, []);

  return view;
}
