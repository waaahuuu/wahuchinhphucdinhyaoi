// ==================== CẤU HÌNH THÔNG TIN GOOGLE SHEETS ====================
const SHEET_ID = '1G6rRcf3--hnji7I4sgpd7kcUHBpG262T9fbSegEcw-8'; 
const SHEET_TITLE = 'Sheet12'; // Hãy kiểm tra xem tab dưới cùng file Excel có đúng tên này không

// Đường dẫn tối ưu hóa JSON để kéo dữ liệu cực tốc độ và mượt mà
const FULL_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${SHEET_TITLE}`;

let mangaList = [];
const mangaGrid = document.getElementById('mangaGrid');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('.filter-btn');

async function loadMangaFromSheets() {
    try {
        const response = await fetch(FULL_URL);
        const text = await response.text();
        
        // Trích xuất cấu trúc dữ liệu JSON từ Google Sheets gửi về
        const jsonString = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
        const jsonData = JSON.parse(jsonString);
        const rows = jsonData.table.rows;

        mangaList = rows.map(row => {
            const cells = row.c;
            
            // Hàm lấy an toàn dữ liệu từ ô (nếu ô trống thì trả về chữ rỗng "")
            const getVal = (index) => (cells[index] && cells[index].v !== null) ? cells[index].v : '';

            // --- ĐỐI CHIẾU CHÍNH XÁC THEO ẢNH CHỤP SƠ ĐỒ CỘT THỰC TẾ ---
            // Cột A (index 0): # (Số thứ tự)
            // Cột B (index 1): Covers (Trang bìa - hỗ trợ link chữ hoặc nhiều link)
            // Cột C (index 2): Title (Tên truyện)
            // Cột D (index 3): Author (Tác giả)
            // Cột E (index 4): Tags (Thể loại drop-down)
            // Cột F (index 5): Related series (Truyện liên quan)
            // Cột G (index 6): Mag/publisher (Nhà xuất bản)
            // Cột H (index 7): Volumes read (Số tập đã đọc)
            // Cột I (index 8): Finish date (Ngày hoàn thành)

            let rawCover = String(getVal(1)).trim();
            let finalCover = 'https://via.placeholder.com/200x280'; // Ảnh mặc định nếu trống hoặc lỗi

            if (rawCover) {
                // Tách chuỗi link chữ nếu bạn dán nhiều link cách nhau bằng dấu phẩy hoặc khoảng trắng
                let coverArray = rawCover.split(/[\s,]+/);
                if (coverArray[0].startsWith('http')) {
                    finalCover = coverArray[0];
                }
            }

            return {
                image: finalCover,
                title: String(getVal(2)).trim(),      // ĐÃ SỬA: Lấy từ Cột C (index 2)
                author: String(getVal(3)).trim(),     // ĐÃ SỬA: Lấy từ Cột D (index 3)
                tags: String(getVal(4)).trim(),       // ĐÃ SỬA: Lấy từ Cột E (index 4)
                publisher: String(getVal(6)).trim(),  // ĐÃ SỬA: Lấy từ Cột G (index 6)
                volumes: getVal(7),                   // ĐÃ SỬA: Lấy từ Cột H (index 7)
                finishDate: getVal(8)                 // ĐÃ SỬA: Lấy từ Cột I (index 8)
            };
        }).filter(manga => manga.title && manga.title.toUpperCase() !== 'TITLE' && manga.title !== ''); 
        // Lọc bỏ hàng trống và hàng tiêu đề đầu bảng chứa chữ "Title"

        displayManga(mangaList);
    } catch (error) {
        mangaGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: red; font-weight: bold;">Lỗi kết nối dữ liệu! Đang tải thư viện truyện...</p>`;
        console.error(error);
    }
}

function displayManga(list) {
    mangaGrid.innerHTML = '';
    if(list.length === 0) {
        mangaGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #95a5a6;">Không tìm thấy truyện phù hợp.</p>`;
        return;
    }

    list.forEach(manga => {
        const card = document.createElement('div');
        card.classList.add('manga-card');

        // PHÂN LOẠI TRẠNG THÁI CHUẨN: Có ngày hoàn thành (Finish date) -> Đã xong, trống -> Đang đọc
        let statusClass = 'reading';
        let statusText = 'Đang đọc';
        if (manga.finishDate && manga.finishDate.toString().trim() !== '') {
            statusClass = 'completed';
            statusText = 'Đã xong';
        }

        card.innerHTML = `
            <div class="cover-container">
                <img src="${manga.image}" alt="${manga.title}" class="manga-cover" loading="lazy" onerror="this.onerror=null; this.src='https://via.placeholder.com/200x280';">
            </div>
            <div class="manga-info">
                <div>
                    <h3 class="manga-title" title="${manga.title}">${manga.title}</h3>
                    <span class="manga-author">Tác giả: ${manga.author || 'Chưa rõ'}</span>
                </div>
                
                <div>
                    <div style="margin: 4px 0; display: flex; justify-content: space-between; align-items: center;">
                        <span class="status-tag status-${statusClass}">${statusText}</span>
                        <span style="font-size: 11px; color: #7f8c8d; font-weight: bold;">Đã đọc: ${manga.volumes || '0'} tập</span>
                    </div>
                    <div style="color: #3498db; font-size: 11px; font-weight: 500; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">NXB: ${manga.publisher || 'Chưa rõ'}</div>
                    <div style="color: #7f8c8d; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${manga.tags}">Tags: ${manga.tags || 'Không có'}</div>
                </div>
            </div>
        `;
        mangaGrid.appendChild(card);
    });
}

function filterAndSearchManga() {
    const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
    const searchKeyword = searchInput.value.toLowerCase().trim();

    const filteredList = mangaList.filter(manga => {
        const isCompleted = manga.finishDate && manga.finishDate.toString().trim() !== '';
        const matchesFilter = (activeFilter === 'all') || 
                              (activeFilter === 'completed' && isCompleted) || 
                              (activeFilter === 'reading' && !isCompleted);
        
        const matchesSearch = manga.title.toLowerCase().includes(searchKeyword) || 
                              manga.author.toLowerCase().includes(searchKeyword) ||
                              manga.tags.toLowerCase().includes(searchKeyword) ||
                              manga.publisher.toLowerCase().includes(searchKeyword);

        return matchesFilter && matchesSearch;
    });
    displayManga(filteredList);
}

searchInput.addEventListener('input', filterAndSearchManga);
filterButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        filterAndSearchManga();
    });
});

loadMangaFromSheets();