
**Tài liệu Yêu cầu Phần mềm**

**Cho**

**TravelTVB**

**Version 1.0**

**Viết bởi Phùng Anh Tuấn, Thái Trí Văn, Trần Hoàng Bảo**

**Nhóm 15**

**Ngày 01/02/2026**


***Tài liệu yêu cầu phần mềm cho TravelTVB		Trang ***ii******

<a name="_toc344877432"></a><a name="_toc344879822"></a><a name="_toc346508722"></a><a name="_toc346508952"></a><a name="_toc346509227"></a><a name="_toc220852807"></a>**Table of Contents**

**Table of Contents	[**ii**](#_toc220852807)**

**Lịch Sử Chỉnh Sửa	[**ii**](#_toc220852808)**

**1.**	**Tổng Quan	[**1**](#_toc220852809)**

1.1	Mục Tiêu	[1](#_toc220852810)

1.2	Phạm Vi Dự Án	[1](#_toc220852811)

1.3	References	[1](#_toc220852812)

**2.**	**Overall Description	[**2**](#_toc220852813)**

2.1	Các Tính Năng Chính	[2](#_toc220852814)

2.2	Lớp Người Dùng và Đặc Điểm	[2](#_toc220852815)

2.3	Môi Trường Vận Hành	[2](#_toc220852816)

2.4	Giả Định và Phụ Thuộc	[2](#_toc220852817)

**3.**	**Các Tính Năng Hệ Thống	[**3**](#_toc220852818)**

3.1	Tính năng: Tìm kiếm và Lọc Tour Nâng cao	[3](#_toc220852819)

3.2	Tính năng: Đặt Tour và Thanh toán	[3](#_toc220852820)

3.3	Tính năng: Trợ lý ảo AI	[4](#_toc220852821)

3.4	Tính năng: Quản trị Nội dung	[4](#_toc220852822)

**4.**	**Other Nonfunctional Requirements	[**5**](#_toc220852823)**

4.1	Yêu cầu Hiệu năng (Còn Chỉnh Sửa)	[5](#_toc220852824)

4.2	Yêu cầu Bảo mật	[5](#_toc220852825)

4.3	Thuộc tính Chất lượng Phần mềm	[5](#_toc220852826)

**5.**	**Phụ Lục A: Thuật Ngữ	[**5**](#_toc220852827)**



<a name="_toc220852808"></a>**Lịch Sử Chỉnh Sửa**

|**Tên Chỉnh Sửa**|**Ngày**|**Lí do chỉnh sửa**|**Version**|
| :- | :- | :- | :- |
|Khởi tạo tài liệu|01/02/2026|Tạo Version đầu tiên dựa trên đề cương đồ án|1\.0|
|||||




***Tài liệu yêu cầu phần mềm cho TravelTVB		Trang ***6******
1. # <a name="_toc220852809"></a>**Tổng Quan**
   1. ## <a name="_toc220852810"></a>**Mục Tiêu**
      *Tài liệu này xác định các yêu cầu phần mềm cho hệ thống **TravelTVB** – Website hướng dẫn du lịch và cung cấp tour trực tuyến. Tài liệu này mô tả chi tiết các tính năng chức năng và phi chức năng, giao diện người dùng, và các ràng buộc hệ thống. Mục đích là để làm cơ sở thống nhất giữa các bên liên quan và là hướng dẫn chi tiết cho đội ngũ phát triển, kiểm thử (QA/QC).*
   1. ## <a name="_toc220852811"></a>**Phạm Vi Dự Án**
      *TravelTVB là một nền tảng web thương mại điện tử kết hợp portfolio dành cho đại lý du lịch.*

- ***Mục tiêu chính:** Cung cấp giải pháp tìm kiếm, đặt tour du lịch trực tuyến và tra cứu thông tin du lịch thông qua blog và trợ lý ảo AI.*
- ***Lợi ích:** Giúp người dùng dễ dàng tìm kiếm tour phù hợp nhờ bộ lọc nâng cao và Chatbot thông minh (RAG). Giúp quản trị viên quản lý nội dung tour và đơn hàng dễ dàng thông qua kiến trúc Headless CMS.*
- ***Chiến lược:** Sử dụng công nghệ hiện đại (ReactJS, Strapi, AI RAG) để tạo lợi thế cạnh tranh về trải nghiệm người dùng (UX) và tốc độ phát triển.*

1. ## <a name="_toc439994672"></a><a name="_toc220852812"></a>**References**
- *Tài liệu ReactJS (react.dev).*
- *Tài liệu Strapi Headless CMS (strapi.io).*
- *Tài liệu tích hợp VNPay Sandbox API.*
- *Tài liệu LangChain & Google AI Studio cho RAG Chatbot.*

1. # <a name="_toc439994673"></a>**<a name="_toc220852813"></a>Overall Description**
   1. ## <a name="_toc220852814"></a>**Các Tính Năng Chính**
1. ***Quản lý Tour & Nội dung (CMS):** Quản trị viên thêm/sửa/xóa tour, bài viết blog.*
1. ***Booking Engine:** Cho phép khách hàng tìm kiếm, lọc tour, thêm vào giỏ hàng và thanh toán.*
1. ***Trợ lý ảo AI (RAG):** Chatbot trả lời câu hỏi dựa trên dữ liệu tour thực tế (giá, lịch trình).*
1. ***Thanh toán trực tuyến:** Tích hợp cổng VNPay (Sandbox).*

1. ## <a name="_toc220852815"></a>**Lớp Người Dùng và Đặc Điểm**
   ***Khách vãng lai (Guest Visitor):***

- *Đặc điểm: Người dùng chưa đăng nhập, muốn tìm hiểu thông tin.*
- *Quyền hạn: Xem tour, đọc blog, dùng Chatbot, nhưng không thể xem lịch sử mua hàng.*

***Khách hàng thành viên (Registered Customer):***

- *Đặc điểm: Người dùng đã có tài khoản, có nhu cầu mua tour.*
- *Quyền hạn: Đầy đủ quyền của Guest + Đặt tour, Thanh toán, Xem lịch sử đơn hàng.*

***Quản trị viên (Administrator):***

- *Đặc điểm: Nhân viên vận hành của đại lý du lịch, có kiến thức cơ bản về công nghệ.*
- *Quyền hạn: Truy cập Strapi Dashboard để quản lý nội dung và đơn hàng.*

1. ## <a name="_toc220852816"></a>**Môi Trường Vận Hành**
   ***Client:** Trình duyệt web hiện đại (Chrome, Firefox, Safari, Edge) trên Desktop và thiết bị di động (Responsive).*

   ***Server:** Node.js environment (để chạy Strapi).*

   ***Internet:** Yêu cầu kết nối mạng ổn định để fetch API và gọi AI Service.*
1. ## <a name="_toc220852817"></a>**Giả Định và Phụ Thuộc**
   *Giả định rằng API của Google AI Studio và Pinecone hoạt động ổn định và miễn phí trong giới hạn cho phép.*

   *Giả định người dùng có kết nối Internet khi sử dụng ứng dụng.*
1. # <a name="_toc439994682"></a><a name="_toc439994687"></a>**<a name="_toc220852818"></a>Các Tính Năng Hệ Thống**
   1. ## <a name="_toc220852819"></a>**Tính năng: Tìm kiếm và Lọc Tour Nâng cao**
3\.1.1	Mô tả và Mức độ ưu tiên

*Cho phép người dùng tìm tour theo địa điểm, giá, và thời gian.*

*Mức độ ưu tiên: **High (Cao)** - Đây là chức năng cốt lõi để bán hàng.*

3\.1.2	Chuỗi Kích thích/Phản hồi

*User chọn bộ lọc "Miền Bắc" và khoảng giá "2-5 triệu".*

*Hệ thống gọi API tới Strapi với tham số filter.*

*Hệ thống hiển thị danh sách tour thỏa mãn điều kiện.*

3\.1.3	Yêu cầu Chức năng

***REQ-SEARCH-01:** Hệ thống phải cung cấp thanh tìm kiếm theo từ khóa (tên tour).*

***REQ-SEARCH-02:** Hệ thống phải cung cấp bộ lọc theo khoảng giá (Price Range Slider).*

***REQ-SEARCH-03:** Hệ thống phải cung cấp bộ lọc theo địa điểm (Location Category).*

***REQ-SEARCH-04:** Kết quả tìm kiếm phải hiển thị: Hình ảnh, Tên tour, Giá tiền, và Thời lượng.*


1. ## <a name="_toc220852820"></a>**Tính năng: Đặt Tour và Thanh toán**
3\.2.1	Mô tả và Mức độ ưu tiên

*Quy trình từ lúc chọn tour đến khi thanh toán thành công.\
Mức độ ưu tiên: **High (Cao)**.*

3\.2.2 Chuỗi Kích thích/Phản hồi:

*User nhấn "Đặt ngay" -> Hệ thống thêm vào giỏ hàng.\
User nhấn "Thanh toán" -> Hệ thống chuyển hướng sang VNPay Sandbox.\
User nhập thẻ test -> VNPay trả về kết quả -> Hệ thống cập nhật trạng thái đơn hàng "Đã thanh toán".*

3\.2.3 Yêu cầu Chức năng:

***REQ-BOOK-01:** Hệ thống cho phép chọn số lượng người lớn/trẻ em.\
**REQ-BOOK-02:** Hệ thống phải tính tổng tiền tạm tính chính xác.\
**REQ-BOOK-03:** Hệ thống phải tích hợp API VNPay để tạo URL thanh toán an toàn (có checksum).\
**REQ-BOOK-04:** Hệ thống phải lưu đơn hàng vào database với trạng thái ban đầu là "Pending".*
1. ## <a name="_toc220852821"></a>**Tính năng: Trợ lý ảo AI**
3\.3.1	Mô tả và Mức độ ưu tiên

*Chatbot trả lời câu hỏi tự nhiên dựa trên dữ liệu tour có sẵn.*

*Mức độ ưu tiên: **Medium (Trung bình)** - Tính năng nâng cao tạo điểm nhấn.*

3\.3.2	Chuỗi Kích thích/Phản hồi

*User hỏi: "Có tour nào đi Đà Lạt giá dưới 3 triệu không?"*

*Hệ thống vector hóa câu hỏi -> Tìm dữ liệu liên quan trong Pinecone -> Gửi prompt cho LLM.*

*Chatbot trả lời: "Dạ có, bên em có tour Đà Lạt 3N2Đ giá 2.5 triệu..."*

3\.3.3	Yêu cầu Chức năng

***REQ-AI-01:** Chatbot phải hiểu ngôn ngữ tự nhiên tiếng Việt.\
**REQ-AI-02:** Chatbot chỉ được trả lời dựa trên dữ liệu (context) được cung cấp, không bịa đặt thông tin (Hallucination).\
**REQ-AI-03:** Giao diện chat phải nổi (Floating Widget) ở góc màn hình.*

1. ## <a name="_toc220852822"></a>**Tính năng: Quản trị Nội dung**
3\.4.1	Mô tả và Mức độ ưu tiên

*Khu vực dành cho Admin quản lý dữ liệu.\
Mức độ ưu tiên: **High (Cao)**.*

3\.4.3	Yêu cầu Chức năng

***REQ-ADMIN-01:** Admin phải đăng nhập được vào trang quản trị Strapi**.\
REQ-ADMIN-02:** Admin có thể Tạo, Đọc, Sửa, Xóa (CRUD) Tour và Bài viết.\
**REQ-ADMIN-03:** Admin có thể xem danh sách đơn hàng đặt tour.*

1. # <a name="_toc439994690"></a><a name="_toc220852823"></a>**Other Nonfunctional Requirements**
   1. ## <a name="_toc220852824"></a>**Yêu cầu Hiệu năng (Còn Chỉnh Sửa)**
      *Thời gian tải trang chủ (First Contentful Paint) < 2 giây trên mạng 4G tiêu chuẩn.*

      *hời gian phản hồi của Chatbot AI < 5 giây.*
   1. ## <a name="_toc220852825"></a>**Yêu cầu Bảo mật**
      *Không lưu trữ thông tin thẻ tín dụng của người dùng (mọi thao tác nhập thẻ diễn ra trên trang của VNPay).*

      *API Key (Google AI, Strapi Token) phải được bảo mật trong biến môi trường (.env), không commit lên Git.*

      *Mật khẩu người dùng (nếu có đăng ký) phải được mã hóa (Hash).*
   1. ## <a name="_toc220852826"></a>**Thuộc tính Chất lượng Phần mềm**
      ***Tính khả dụng (Usability):** Giao diện trực quan, quy trình đặt tour tối đa 3 bước.*

      ***Tính bảo trì (Maintainability):** Code Frontend chia component rõ ràng, Code Backend sử dụng Content Type của Strapi chuẩn hóa.*

      ***Tính mở rộng (Scalability**): Chưa có thông tin hehe.*
1. # <a name="_toc220852827"></a>**Phụ Lục A: Thuật Ngữ**
   ·  **RAG (Retrieval-Augmented Generation):** Kỹ thuật kết hợp truy xuất dữ liệu (từ database) với mô hình ngôn ngữ lớn để tăng độ chính xác.

   ·  **Headless CMS:** Hệ quản trị nội dung chỉ cung cấp API (Backend), không bao gồm giao diện hiển thị (Frontend).

   ·  **Sandbox:** Môi trường kiểm thử cô lập, cho phép chạy thử các tính năng (như thanh toán) mà không ảnh hưởng hệ thống thật.

   ·  **CRUD:** Create, Read, Update, Delete (4 thao tác cơ bản với dữ liệu).

   ·  **Prompt Engineering:** Kỹ thuật thiết kế câu lệnh đầu vào để hướng dẫn AI trả lời đúng mong muốn.

