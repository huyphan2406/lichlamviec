# Hướng Dẫn Sử Dụng Cursor Từ A Đến Z Cho Người Mới Bắt Đầu

## Mục Lục
1. [Giới Thiệu Về Cursor](#giới-thiệu-về-cursor)
2. [Cài Đặt](#cài-đặt)
3. [Giao Diện Cơ Bản](#giao-diện-cơ-bản)
4. [Các Tính Năng AI Chính](#các-tính-năng-ai-chính)
5. [Phím Tắt Quan Trọng](#phím-tắt-quan-trọng)
6. [Các Tính Năng Nâng Cao](#các-tính-năng-nâng-cao)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Giới Thiệu Về Cursor

**Cursor** là một code editor được xây dựng dựa trên VS Code, được tích hợp sẵn AI để hỗ trợ lập trình viên viết code nhanh hơn và hiệu quả hơn.

### Điểm Nổi Bật:
- ✅ Tích hợp AI mạnh mẽ (GPT-4, Claude, v.v.)
- ✅ Tự động hoàn thiện code thông minh
- ✅ Chat với AI về code
- ✅ Refactor code tự động
- ✅ Tương thích với VS Code extensions

---

## Cài Đặt

### Bước 1: Tải Cursor
1. Truy cập: https://cursor.sh
2. Chọn phiên bản phù hợp với hệ điều hành (Windows/Mac/Linux)
3. Tải file cài đặt về máy

### Bước 2: Cài Đặt
- **Windows**: Chạy file `.exe` và làm theo hướng dẫn
- **Mac**: Mở file `.dmg` và kéo Cursor vào Applications
- **Linux**: Giải nén và chạy file thực thi

### Bước 3: Đăng Ký/Đăng Nhập
1. Mở Cursor lần đầu
2. Tạo tài khoản hoặc đăng nhập
3. Chọn gói sử dụng (Free/Pro)

---

## Giao Diện Cơ Bản

### Các Vùng Chính:

```
┌─────────────────────────────────────────┐
│  Menu Bar (File, Edit, View, ...)      │
├──────────┬──────────────────────────────┤
│          │                              │
│ Sidebar  │   Editor Area                │
│ (Explorer│   (Nơi viết code)            │
│  Extensions)                            │
│          │                              │
│          │                              │
├──────────┴──────────────────────────────┤
│  Terminal / Output / Problems           │
└─────────────────────────────────────────┘
```

### Sidebar (Thanh Bên):
- **Explorer**: Quản lý files và folders
- **Search**: Tìm kiếm trong project
- **Source Control**: Git integration
- **Extensions**: Quản lý extensions
- **Cursor Tab**: Chat với AI

---

## Các Tính Năng AI Chính

### 1. **Cursor Chat** (Chat với AI)

#### Cách Mở:
- Nhấn `Ctrl + L` (Windows/Linux) hoặc `Cmd + L` (Mac)
- Hoặc click vào biểu tượng chat ở sidebar

#### Cách Sử Dụng:
```
1. Chọn code bạn muốn hỏi về
2. Nhấn Ctrl + L để mở chat
3. Gõ câu hỏi, ví dụ:
   - "Giải thích đoạn code này"
   - "Tối ưu hóa function này"
   - "Tìm bug trong code"
   - "Viết test cho function này"
```

#### Ví Dụ:
```
Bạn: "Tạo một function để tính tổng các số trong mảng"

AI sẽ tự động tạo code cho bạn!
```

### 2. **Composer** (Soạn Code Tự Động)

#### Cách Mở:
- Nhấn `Ctrl + I` (Windows/Linux) hoặc `Cmd + I` (Mac)
- Hoặc click vào biểu tượng Composer

#### Tính Năng:
- Viết code theo yêu cầu tự nhiên
- Refactor nhiều files cùng lúc
- Tạo features hoàn chỉnh

#### Ví Dụ:
```
Bạn: "Tạo một component React để hiển thị danh sách sản phẩm"

AI sẽ:
1. Tạo file component
2. Viết code đầy đủ
3. Thêm styling nếu cần
```

### 3. **Tab Autocomplete** (Tự Động Hoàn Thiện)

#### Cách Hoạt Động:
- Khi bạn gõ code, AI sẽ tự động đề xuất
- Nhấn `Tab` để chấp nhận đề xuất
- Nhấn `Esc` để bỏ qua

#### Tips:
- Viết comment mô tả rõ ràng để AI hiểu ý định
- Ví dụ: `// Function to calculate total price with discount`

### 4. **Inline Edit** (Chỉnh Sửa Nội Tuyến)

#### Cách Sử Dụng:
1. Chọn code bạn muốn sửa
2. Nhấn `Ctrl + K` (Windows/Linux) hoặc `Cmd + K` (Mac)
3. Gõ yêu cầu, ví dụ: "Thêm error handling"
4. Nhấn Enter để áp dụng

---

## Phím Tắt Quan Trọng

### Phím Tắt AI:
| Phím Tắt | Chức Năng |
|----------|-----------|
| `Ctrl + L` | Mở Cursor Chat |
| `Ctrl + I` | Mở Composer |
| `Ctrl + K` | Inline Edit (chỉnh sửa code đã chọn) |
| `Tab` | Chấp nhận đề xuất AI |
| `Esc` | Bỏ qua đề xuất |

### Phím Tắt Cơ Bản:
| Phím Tắt | Chức Năng |
|----------|-----------|
| `Ctrl + P` | Quick Open (tìm file nhanh) |
| `Ctrl + Shift + P` | Command Palette |
| `Ctrl + B` | Ẩn/hiện Sidebar |
| `Ctrl + J` | Ẩn/hiện Terminal |
| `Ctrl + /` | Comment/Uncomment |
| `Ctrl + D` | Chọn từ tiếp theo giống nhau |
| `Alt + ↑/↓` | Di chuyển dòng lên/xuống |
| `Shift + Alt + ↑/↓` | Copy dòng lên/xuống |

### Phím Tắt Tìm Kiếm:
| Phím Tắt | Chức Năng |
|----------|-----------|
| `Ctrl + F` | Tìm trong file hiện tại |
| `Ctrl + Shift + F` | Tìm trong toàn bộ project |
| `Ctrl + H` | Find & Replace |

---

## Các Tính Năng Nâng Cao

### 1. **Multi-File Editing với Composer**

Composer có thể chỉnh sửa nhiều files cùng lúc:

```
Bạn: "Thêm error handling vào tất cả các API calls trong folder services"

AI sẽ tự động:
- Tìm tất cả files trong folder services
- Thêm error handling vào mỗi file
- Giữ nguyên logic hiện có
```

### 2. **Codebase Indexing**

Cursor tự động index codebase để AI hiểu context tốt hơn:
- Tự động index khi mở project
- Có thể force re-index trong settings

### 3. **Rules for AI** (Quy Tắc Cho AI)

Tạo file `.cursorrules` trong root project để định nghĩa style và quy tắc:

```markdown
# .cursorrules

- Luôn sử dụng TypeScript strict mode
- Sử dụng async/await thay vì promises
- Format code với Prettier
- Viết comment bằng tiếng Việt
- Sử dụng functional programming khi có thể
```

### 4. **Codebase Chat**

Chat với AI về toàn bộ codebase:
- AI có thể hiểu context của nhiều files
- Hỏi về architecture, design patterns
- Tìm bugs xuyên suốt project

### 5. **Diff View**

Xem thay đổi trước khi apply:
- Composer hiển thị diff trước khi apply
- Có thể accept/reject từng thay đổi
- Review code được AI tạo ra

---

## Best Practices

### 1. **Viết Prompt Rõ Ràng**

❌ **Không tốt:**
```
"Fix this"
```

✅ **Tốt:**
```
"Thêm error handling cho function này, log lỗi ra console và throw custom error message"
```

### 2. **Sử Dụng Context**

- Chọn code liên quan trước khi chat
- Mở các files liên quan trong editor
- AI sẽ hiểu context tốt hơn

### 3. **Iterative Development**

- Bắt đầu với yêu cầu đơn giản
- Yêu cầu AI cải thiện từng bước
- Ví dụ: "Thêm validation", sau đó "Thêm unit tests"

### 4. **Review Code của AI**

- Luôn review code AI tạo ra
- Test kỹ trước khi commit
- AI có thể mắc lỗi, cần kiểm tra

### 5. **Sử Dụng .cursorrules**

Tạo file `.cursorrules` để:
- Định nghĩa coding style
- Quy tắc đặt tên
- Framework/library preferences

### 6. **Keyboard Shortcuts**

Học các phím tắt quan trọng để tăng tốc độ:
- `Ctrl + L` cho chat
- `Ctrl + I` cho composer
- `Ctrl + K` cho inline edit

---

## Troubleshooting

### Vấn Đề 1: AI Không Hiểu Context

**Giải Pháp:**
- Chọn code liên quan trước khi chat
- Mô tả rõ ràng hơn trong prompt
- Sử dụng `.cursorrules` để định nghĩa context

### Vấn Đề 2: Code AI Tạo Ra Có Lỗi

**Giải Pháp:**
- Review code kỹ trước khi sử dụng
- Yêu cầu AI fix lỗi cụ thể
- Cung cấp error message cho AI

### Vấn Đề 3: Autocomplete Không Hoạt Động

**Giải Pháp:**
- Kiểm tra kết nối internet
- Restart Cursor
- Kiểm tra settings: `Settings > Features > Tab Autocomplete`

### Vấn Đề 4: Composer Không Apply Code

**Giải Pháp:**
- Kiểm tra file có đang được chỉnh sửa không
- Kiểm tra quyền ghi file
- Thử lại với prompt khác

### Vấn Đề 5: AI Trả Lời Chậm

**Giải Pháp:**
- Kiểm tra kết nối internet
- Sử dụng model nhẹ hơn trong settings
- Giảm context size (ít files mở hơn)

---

## Workflow Mẫu

### Workflow 1: Tạo Component Mới

```
1. Nhấn Ctrl + I (Composer)
2. Gõ: "Tạo React component ProductCard với props: name, price, image"
3. Review code AI tạo
4. Apply changes
5. Test component
```

### Workflow 2: Refactor Code

```
1. Chọn code cần refactor
2. Nhấn Ctrl + K (Inline Edit)
3. Gõ: "Refactor function này để sử dụng async/await và thêm error handling"
4. Review và apply
```

### Workflow 3: Debug Bug

```
1. Chọn code có bug
2. Nhấn Ctrl + L (Chat)
3. Gõ: "Tìm bug trong đoạn code này. Error: [paste error message]"
4. Áp dụng fix AI đề xuất
5. Test lại
```

### Workflow 4: Viết Tests

```
1. Chọn function cần test
2. Nhấn Ctrl + L (Chat)
3. Gõ: "Viết unit tests cho function này với Jest"
4. Review và chỉnh sửa tests
```

---

## Tips & Tricks

### 1. **Sử Dụng @ Symbol**

Trong chat, sử dụng `@` để reference:
- `@filename.js` - Reference một file cụ thể
- `@folder` - Reference cả folder
- `@codebase` - Reference toàn bộ project

### 2. **Multi-Cursor Editing**

- `Alt + Click` - Tạo nhiều cursor
- `Ctrl + Alt + ↑/↓` - Thêm cursor trên/dưới
- Viết code ở nhiều chỗ cùng lúc

### 3. **Snippets**

Tạo snippets cho code thường dùng:
- `Ctrl + Shift + P` > "Configure User Snippets"
- Định nghĩa snippets tùy chỉnh

### 4. **Extensions Hữu Ích**

- **GitLens**: Git integration mạnh mẽ
- **Prettier**: Format code tự động
- **ESLint**: Lint code
- **Error Lens**: Hiển thị lỗi inline
- **Path Intellisense**: Autocomplete đường dẫn

### 5. **Settings Tối Ưu**

Truy cập: `File > Preferences > Settings`

Các settings nên bật:
- `Editor: Format On Save`
- `Editor: Auto Save`
- `Cursor: Tab Autocomplete Enabled`
- `Cursor: Inline Edit Enabled`

---

## Tài Nguyên Học Tập

### Tài Liệu Chính Thức:
- Website: https://cursor.sh
- Docs: https://docs.cursor.sh
- Discord: https://discord.gg/cursor

### Video Tutorials:
- YouTube: Tìm "Cursor AI tutorial"
- Các kênh về VS Code cũng áp dụng được

### Community:
- Reddit: r/cursor
- Twitter: @cursor

---

## Kết Luận

Cursor là một công cụ mạnh mẽ giúp tăng năng suất lập trình đáng kể. Bắt đầu với các tính năng cơ bản, sau đó dần khám phá các tính năng nâng cao.

**Lưu ý quan trọng:**
- AI là công cụ hỗ trợ, không thay thế tư duy của bạn
- Luôn review code AI tạo ra
- Học từ code AI để cải thiện kỹ năng
- Sử dụng AI một cách có trách nhiệm

**Chúc bạn code vui vẻ với Cursor! 🚀**

---

*Tài liệu này được cập nhật thường xuyên. Nếu có câu hỏi, hãy tham khảo docs chính thức hoặc community.*

