**ĐỀ CƯƠNG ĐỒ ÁN**

**Nhóm sinh viên:** - 3122411237, Phùng Anh Tuấn

`		     `- 3122411014, Trần Hoàng Bảo

`		     `- 3122411242, Thái Trí Văn

**1. Tên đề tài:** Xây dựng Website hướng dẫn du lịch và cung cấp tour trực tuyến (**TravelTVB**).

**2. Mục tiêu và phạm vi:**

- **Mục tiêu:**
  - Xây dựng hệ thống website thương mại điện tử chuyên về du lịch với kiến trúc Headless CMS.
  - Cung cấp nền tảng quản lý nội dung động (bài viết hướng dẫn, thông tin tour) cho admin.
  - Tích hợp tính năng tìm kiếm nâng cao và trợ lý ảo AI (Chatbot) để tư vấn tự động dựa trên dữ liệu thực của website.
- **Phạm vi:**
  - **User (Khách hàng):** Xem tin tức, tra cứu tour, đặt tour, thanh toán trực tuyến (Sandbox), tương tác với Chatbot.
  - **Admin:** Quản lý bài viết, quản lý gói tour, quản lý đơn hàng thông qua Dashboard.
  - **Hệ thống:** Website chạy trên trình duyệt, không bao gồm ứng dụng di động.

**3. Phương pháp thực hiện:**

Phương pháp tiếp cận:

- Sử dụng mô hình phát triển phần mềm linh hoạt **Scrumban** để phát triển tính năng theo từng giai đoạn.
- Nghiên cứu kỹ thuật RAG (Retrieval-Augmented Generation) để xây dựng Chatbot.

Công cụ và Ngôn ngữ:

- **Frontend:** ReactJS, Vite, CSS.
- **Backend/CMS:** Strapi (Headless CMS).
- **Cơ sở dữ liệu:** SQLite (mặc định của Strapi).
- **Thanh toán:** Tích hợp VNPay Sandbox.
- **AI/Chatbot:** LangChain, Google AI Studio API, Pinecone.
**\


**4. Nội dung chính:**

- **Tìm hiểu lý thuyết:**
  - Kiến trúc Headless CMS và lợi ích trong phát triển web hiện đại.
  - Cơ chế hoạt động của React Hooks và State Management.
  - Cơ chế Vector Embedding và RAG trong xử lý ngôn ngữ tự nhiên.
- **Giải pháp đề xuất:**
  - Xây dựng Frontend tách biệt hoàn toàn với Backend, giao tiếp qua RESTful API/GraphQL.
  - Sử dụng Strapi làm trung tâm dữ liệu.
  - Tích hợp Chatbot có khả năng "đọc" dữ liệu từ Strapi để trả lời câu hỏi cụ thể về giá và lịch trình tour.
- **Kết quả dự kiến:**
  - Website hoàn chỉnh với giao diện thân thiện, chuẩn Responsive.
  - Quy trình đặt tour và thanh toán hoạt động trơn tru trên môi trường kiểm thử.
  - Chatbot trả lời chính xác các câu hỏi liên quan đến dữ liệu tour hiện có trên web.

**5. Tiến độ thực hiện:**

**Tuần 1-2:** Khảo sát yêu cầu, phân tích hệ thống, thiết kế Database trong Strapi.

**Tuần 3-4:** Xây dựng Frontend (Home, About Us, News, Tour Guides) và cấu hình Strapi.

**Tuần 5 (Báo cáo tiến độ):** Demo các chức năng quản lý nội dung (CRUD Tour) và hiển thị thông tin lên Website.

**Tuần 6-7:** Thực hiện tính năng E-commerce (Booking, Cart) và tích hợp VNPay.

**Tuần 8-9 (Báo cáo tiến độ):** Phát triển tính năng tìm kiếm nâng cao và nghiên cứu tích hợp Chatbot (RAG). Demo hoàn chỉnh luồng đặt tour, demo tính năng Chatbot trả lời câu hỏi dựa trên dữ liệu tour thực tế.

**Tuần 10:** Chuẩn bị Slide, Hoàn thành báo cáo và Demo.

**6. Tài liệu tham khảo:**

- Tài liệu chính thức của ReactJS (react.dev).
- Tài liệu phát triển Strapi (strapi.io/documentation).
- Tài liệu tích hợp VNPay Sandbox cho Developer.
- LangChain Documentation (Introduction to RAG).
- Demo Về AI Chatbot của công ty AIAIVN: https://www.youtube.com/watch?v=szf7rp-M3pE
