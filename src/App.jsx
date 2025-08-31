// ... import อื่น ๆ
import Product from "./pages/Product.jsx";

// ...
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/catalog" element={<Catalog />} />
  <Route path="/checkout" element={<Checkout />} />
  <Route path="/transfer" element={<Transfer />} />
  <Route path="/admin" element={<Admin />} />
  <Route path="/product/:id" element={<Product />} />  {/* << เพิ่มบรรทัดนี้ */}
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
